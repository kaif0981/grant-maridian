
import { GoogleGenAI } from "@google/genai";

// Fixed: Obtain the API key exclusively from process.env.API_KEY and initialize inside the function
export const getBusinessInsights = async (salesData: any) => {
  // Create a new GoogleGenAI instance right before the API call as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these restaurant sales records and provide 3 brief bullet points of business advice (focus on popular items, stock warnings, and revenue trends). Data: ${JSON.stringify(salesData)}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    // Access the .text property directly to return the string output
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI insights.";
  }
};
