import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeBestMatch = async (base64Image: string, similarityScore: number) => {
  try {
    const ai = getClient();
    // Remove data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const prompt = `
      Act as a forensic video analyst. Analyze this specific image frame which was identified as a high-confidence match (Similarity: ${similarityScore.toFixed(2)}) from a video surveillance task.
      
      Focus your analysis on identifying details useful for verification:
      1. Describe the subject's appearance, specifically focusing on clothing, colors, and any headwear.
      2. Identify any distinguishing features, accessories (glasses, jewelry), scars, or tattoos if visible.
      3. Assess the image quality (lighting, blur, angle) and how it impacts the positive identification reliability.
      
      Format the output as a concise JSON object with keys: 'personDescription', 'distinguishingFeatures', 'matchReliability'.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};