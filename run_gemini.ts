import { GoogleGenAI } from "@google/genai";

async function run() {
  const VITE_GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
  console.log("Key exists?", !!VITE_GEMINI_API_KEY);
  const ai = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hello",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log(res.text);
  } catch (err) {
    console.error(err);
  }
}

run();
