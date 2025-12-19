import { GoogleGenAI } from '@google/genai';
import { TOURS } from '../data/mockData';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TOUR_CONTEXT = TOURS.map(t => 
  `- ${t.name}: $${t.price}, Duration: ${t.duration}, Location: ${t.location}. Description: ${t.description}`
).join('\n');

const SYSTEM_PROMPT = `You are an elite Tour Agency Operations Agent. 
You analyze customer messages and provide internal insights and suggested replies.

Your Knowledge of our Tours:
${TOUR_CONTEXT}

Your goals:
1. Identify exactly what the customer is asking for.
2. Suggest a proactive business plan (next steps).
3. Generate 3 short, professional "Smart Replies" that sound human and helpful.

Format your response strictly as a JSON object:
{
  "summary": "Short 1-sentence summary of customer intent",
  "plan": "Proactive next step for the agency owner",
  "sentiment": "Hot" | "Warm" | "Cold" | "Upset",
  "replies": ["Reply 1", "Reply 2", "Reply 3"]
}`;

export const AIService = {
  analyzeConversation: async (history: { role: string; text: string }[]) => {
    try {
      const model = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history.map(h => ({
          role: h.role === 'me' ? 'model' : 'user',
          parts: [{ text: h.text }]
        })),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.2, // Lower temperature for more consistent analysis
        }
      });

      const response = await model;
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return null;
    }
  }
};