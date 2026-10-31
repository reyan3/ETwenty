import Groq from "groq-sdk";

const groq = new Groq( process.env.GROQ_API_KEY );

export default groq;