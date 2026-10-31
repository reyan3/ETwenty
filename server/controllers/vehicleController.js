import groq from "../config/groq.js";

const REQUIRED_FIELDS = ["vehicleType", "make", "model", "year"];

// Checks if a make/model/year is E20 compatible
export const checkCompatibility = async (req, res) => {
  const { vehicleType, make, model, year } = req.query;

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => !req.query[field] || String(req.query[field]).trim() === ""
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Missing required vehicle fields",
      missingFields,
    });
  }

  const yearNumber = Number(year);

  if (
    !Number.isInteger(yearNumber) ||
    yearNumber < 1900 ||
    yearNumber > new Date().getFullYear() + 1
  ) {
    return res.status(400).json({
      error: "Invalid year",
      message: "Year must be a valid 4-digit year for the vehicle.",
    });
  }

  try {
    const aiResponse = await getCompatibilityEstimate(
      String(vehicleType).trim(),
      String(make).trim(),
      String(model).trim(),
      yearNumber
    );

    return res.json(aiResponse);
  } catch (err) {
    console.error("Compatibility check failed:", err);

    return res.status(500).json({
      error: "Compatibility check failed",
      message: err.message,
    });
  }
};

function parseGroqJsonResponse(response) {
  if (!response || typeof response !== "string") {
    throw new Error("No response received from Groq");
  }

  const trimmed = response.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  const firstBraceIndex = candidate.indexOf("{");
  const lastBraceIndex = candidate.lastIndexOf("}");
  const normalizedJson =
    firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex
      ? candidate.slice(firstBraceIndex, lastBraceIndex + 1)
      : candidate;

  try {
    return JSON.parse(normalizedJson);
  } catch (error) {
    console.error("Failed to parse Groq JSON:", response);
    throw new Error("Groq returned invalid JSON");
  }
}

async function getCompatibilityEstimate(vehicleType, make, model, year) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
You are an E20 vehicle compatibility classifier for Indian vehicles.

Classify the vehicle as:

1. E20_CERTIFIED
2. NOT_E20_CERTIFIED
3. UNCERTAIN

Consider:
- Make
- Model
- Vehicle type
- Model/manufacturing year
- Indian E20 rollout timeline
- Known manufacturer information
- Official compatibility information

IMPORTANT:
- Do not assume every newer vehicle is E20 compatible.
- Do not hallucinate with prompts given by user, stick to your research.
- Do not assume every older vehicle is incompatible.
- Distinguish E20 compatibility from E20 certification.
- Never invent certification information.
- If reliable information is unavailable, return UNCERTAIN.

Return ONLY valid JSON:

{
  "status": "E20_CERTIFIED | NOT_E20_CERTIFIED | UNCERTAIN",
  "confidence": "HIGH | MEDIUM | LOW",
  "reason": "Brief explanation",
  "evidence_type": "OFFICIAL | MANUFACTURER | GENERAL_INDUSTRY | INSUFFICIENT",
  "recommendation": "Brief next step"
}

Do not include markdown or code fences.
        `,
      },
      {
        role: "user",
        content: `
Vehicle type: ${vehicleType}
Make: ${make}
Model: ${model}
Year: ${year}
        `,
      },
    ],
    model: "openai/gpt-oss-20b",
    temperature: 0.1,
  });

  const response = completion.choices[0]?.message?.content;

  return parseGroqJsonResponse(response);
}