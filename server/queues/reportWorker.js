import { Worker } from "bullmq";
import Report from "../models/Report.js";
import { GoogleGenAI } from "@google/genai";
import { connection } from "./reportQueue.js";
import Groq from "groq-sdk";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;
const receiptModels = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
];

// Normalize both names: lowercase them, remove accents, and treat punctuation as spaces.
// Compare words, regardless of order
// Allow small typos in longer words 

const normalizeStationName = (name) =>
  String(name ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const getEditDistance = (first, second) => {
  const previousRow = Array.from(
    { length: second.length + 1 },
    (_, index) => index,
  );

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    let diagonal = previousRow[0];
    previousRow[0] = firstIndex;

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const previous = previousRow[secondIndex];
      previousRow[secondIndex] = Math.min(
        previousRow[secondIndex] + 1,
        previousRow[secondIndex - 1] + 1,
        diagonal + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }

  return previousRow[second.length];
};

const stationTokensMatch = (first, second) => {
  if (first === second) {
    return true;
  }

  if (Math.min(first.length, second.length) < 4) {
    return false;
  }

  const similarity =
    1 - getEditDistance(first, second) / Math.max(first.length, second.length);
  return similarity >= 0.8;
};

const stationNamesMatch = (firstName, secondName) => {
  const firstTokens = normalizeStationName(firstName);
  const secondTokens = normalizeStationName(secondName);

  if (!firstTokens.length || !secondTokens.length) {
    return false;
  }

  const [shorterName, longerName] =
    firstTokens.length <= secondTokens.length
      ? [firstTokens, secondTokens]
      : [secondTokens, firstTokens];
  const unmatchedTokens = [...longerName];

  return shorterName.every((token) => {
    const matchIndex = unmatchedTokens.findIndex((candidate) =>
      stationTokensMatch(token, candidate),
    );

    if (matchIndex === -1) {
      return false;
    }

    unmatchedTokens.splice(matchIndex, 1);
    return true;
  });
};

// Helper function to extract receipt details using Gemini, then Groq.
const extractReceiptData = async (fileBuffer, mimeType) => {
  const imagePart = {
    inlineData: {
      data: fileBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  const prompt = `
      Analyze this receipt image. Extract and return ONLY a valid JSON object with these exact keys:
      - "stationName": string or null (Name and address of the fuel station on the receipt)
      - "date": string or null (Transaction date in YYYY-MM-DD format)
      - "totalAmount": number or null (Total amount spent on fuel)
      - "isFuelReceipt": boolean (true if it's a valid fuel station receipt, false otherwise)
    `;

  let lastError;
  for (const model of receiptModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [imagePart, prompt],
        responseMimeType: "application/json",
      });

      let rawText = response.text?.trim();
      if (!rawText) {
        throw new Error(`${model} returned an empty response`);
      }
      rawText = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");

      return JSON.parse(rawText);
    } catch (err) {
      lastError = err;
      console.warn(
        `[Gemini OCR] Model ${model} failed; trying the next model:`,
        err.message,
      );
    }
  }

  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${fileBuffer.toString("base64")}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const rawText = response.choices[0]?.message?.content?.trim();
      if (!rawText) {
        throw new Error("Groq returned an empty response");
      }

      return JSON.parse(rawText);
    } catch (err) {
      lastError = err;
      console.error("[Groq OCR] Fallback model failed:", err.message);
    }
  } else {
    console.error(
      "[Groq OCR] Fallback unavailable: GROQ_API_KEY is not configured.",
    );
  }

  console.error(
    "Receipt OCR extraction failed for all configured models:",
    lastError,
  );
  return null;
};

// bg processing is going on, using worker class on redis
export const startReportWorker = () => {
  const worker = new Worker(
    "report-processing-queue",
    async (job) => {
      const { reportId, fileBuffer, mimeType, expectedStationName } = job.data;
      console.log(`[Worker] Processing background job for report: ${reportId}`);

      try {
        const buffer = Buffer.from(fileBuffer.data || fileBuffer);
        const ocrResult = await extractReceiptData(buffer, mimeType);

        let verificationStatus = "Pending Review";
        let ocrExtractedData = null;

        if (ocrResult && ocrResult.isFuelReceipt) {
          ocrExtractedData = {
            stationName: ocrResult.stationName,
            date: ocrResult.date ? new Date(ocrResult.date) : null,
            totalAmount: ocrResult.totalAmount,
          };

          const extractedStationName = ocrResult.stationName || "";
          const isStationMatch = stationNamesMatch(
            extractedStationName,
            expectedStationName,
          );

          let isRecent = true;
          if (ocrResult.date) {
            const receiptDate = new Date(ocrResult.date);
            const daysDiff = (new Date() - receiptDate) / (1000 * 60 * 60 * 24);
            isRecent = daysDiff >= 0 && daysDiff <= 10;
          }

          if (isStationMatch && isRecent) {
            verificationStatus = "Verified Receipt";
          }
        } else {
          verificationStatus = "Verification Failed";
        }

        // Update database with OCR results in the background
        await Report.findByIdAndUpdate(reportId, {
          verificationStatus,
          ocrExtractedData,
        });

        console.log(
          `[Worker] Successfully processed report ${reportId} [Status: ${verificationStatus}]`,
        );
      } catch (err) {
        console.error(`[Worker] Failed processing report ${reportId}:`, err);
        throw err;
      }
    },
    {
    connection,
    concurrency: 1,
    drainDelay: 60,         // Wait 60 seconds before polling an empty queue again
    stalledInterval: 120000,  // Check for stalled jobs every 2 minutes instead of default frequency
    maxStalledCount: 1,     // Minimize retry checks for failed background loops
  },
  );

  worker.on("completed", (job) => {
    console.log(`[Job Completed] Job ID: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[Job Failed] Job ID: ${job.id} failed with error: ${err.message}`,
    );
  });
};
