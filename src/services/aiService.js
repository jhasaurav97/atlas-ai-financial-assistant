import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL;

if (!apiKey) throw new Error("GEMINI_API_KEY is missing in .env file.");
if (!modelName) throw new Error("GEMINI_MODEL is missing in .env file.");

const ai = new GoogleGenAI({ apiKey });

const ATLAS_SYSTEM_INSTRUCTION = `
You are Atlas, a personal financial intelligence assistant that lives inside Telegram.

CORE BEHAVIOR:
- Be conversational, professional, concise, and useful.
- State that quotes are "the latest available" rather than universally "live".

MEMORY & WATCHLIST RULES:
- If the user explicitly states they follow a company, extract its official stock ticker (e.g., AAPL, NVDA) into the "tickersToWatch" array.
- Only extract long-term preferences into "memories". Do not create duplicate memories.

FORMATTING RULES:
- For simple price checks (e.g., "What is NVDA's price?"), just give a concise 1-sentence quote.
- For research questions (e.g., "Why is Nvidia up?", "What's happening in the market?"), use this structure:
  WHAT HAPPENED: ...
  WHY IT MATTERS: ...
  FOR YOU: ...
`;

const ATLAS_RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        reply: { type: "string" },
        memories: {
            type: "array",
            items: {
                type: "object",
                properties: { category: { type: "string" }, fact: { type: "string" } },
                required: ["category", "fact"]
            }
        },
        // 🚀 NEW: Tell Gemini to extract tickers!
        tickersToWatch: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["reply", "memories", "tickersToWatch"]
};

// 🛠️ The Fix: Added financialContext as the 4th parameter
export const askAtlasAI = async (userPrompt, chatHistory = [], userMemories = [], financialContext = null) => {
    try {
        const formattedHistory = chatHistory.map(msg => ({
            role: msg.role === 'atlas' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const contents = [
            ...formattedHistory,
            { role: 'user', parts: [{ text: userPrompt }] }
        ];

        let dynamicInstruction = ATLAS_SYSTEM_INSTRUCTION;

        // Inject User Memories
        if (userMemories.length > 0) {
            const memoryList = userMemories.map(m => `- ${m}`).join('\n');
            dynamicInstruction += `\n\nUSER FACTS (Use these to personalize your responses):\n${memoryList}`;
        }

        // 🚀 Inject Normalized Financial Data
        if (financialContext && financialContext.sources.length > 0) {
            dynamicInstruction += `\n\nEXTERNAL FINANCIAL EVIDENCE (Do not invent data):`;

            if (financialContext.market.length > 0) {
                dynamicInstruction += `\nMARKET DATA: ${JSON.stringify(financialContext.market)}`;
            }
            if (financialContext.news.length > 0) {
                dynamicInstruction += `\nRECENT NEWS: ${JSON.stringify(financialContext.news)}`;
            }
            if (financialContext.filings.length > 0) {
                dynamicInstruction += `\nSEC FILINGS: ${JSON.stringify(financialContext.filings)}`;
            }

            dynamicInstruction += `\n\nCRITICAL RESPONSE RULES:
- For simple quote requests (e.g., "What is Nvidia's price?"), give a concise 1-2 sentence answer.
- For deep research or "Why did it move?" use this structure:
  WHAT HAPPENED: ...
  WHY IT MATTERS: ...
  FOR YOU: (Personalize this based on the user's USER FACTS. If none apply, explain general impact).
- At the very end of your response, include a compact "Sources: ${financialContext.sources.join(", ")}" line.`;
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
                systemInstruction: dynamicInstruction,
                responseMimeType: "application/json",
                responseSchema: ATLAS_RESPONSE_SCHEMA
            }
        });

        if (response?.text) {
            return JSON.parse(response.text.trim());
        }

        return { reply: "I couldn't generate a useful response right now.", memories: [] };
    } catch (error) {
        console.error("AI Service Error:", error.message);
        return { reply: "I'm having trouble processing that right now.", memories: [] };
    }
};