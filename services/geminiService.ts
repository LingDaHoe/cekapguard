
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Direct initialization using process.env.API_KEY as per coding guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function suggestInsuranceNotes(vehicleType: string, insuranceType: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, professional remark (max 20 words) for a ${vehicleType === 'Others' ? 'project insurance' : 'motor insurance'} ${vehicleType === 'Others' ? 'policy' : insuranceType + ' policy'} for ${vehicleType}. Make it sound like an official policy note.`,
    });
    return response.text || "Standard policy terms apply.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Standard policy terms apply.";
  }
}

export async function parseInvoiceSummary(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract key information from this messy insurance note: "${text}". Return only a concise summary.`,
    });
    return response.text;
  } catch (error) {
    return text;
  }
}
