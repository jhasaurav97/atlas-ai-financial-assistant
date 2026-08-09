import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { askAtlasAI } from "./services/aiService.js";
import { saveUserMessage, saveAtlasResponse, getConversationHistory, saveExtractedMemories, getUserMemories, saveToWatchlist } from "./services/memoryService.js";
import { detectFinancialIntent } from "./services/intentService.js";
import { getStockQuote } from "./services/financialService.js";
import { startProactiveAlerts } from './services/cronService.js';
import { getFinancialIntelligence } from "./services/financialDataService.js";

const app = express();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("❌ ERROR: Token not get! Check .env file.");
    process.exit(1);
};

const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatID = msg.chat.id;
    const userText = msg.text;
    const telegramId = msg.from.id;
    const firstName = msg.from.first_name;

    // Ignore empty messages
    if (!userText) return;

    console.log(`Received message from ${firstName}: ${userText}`);

    // UX Feature: Telegram shows "typing..."
    bot.sendChatAction(chatID, "typing");

    try {
        // Tell Telegram to show "Atlas is typing..." while we do the heavy lifting
        await bot.sendChatAction(chatID, 'typing');
        const conversationId = await saveUserMessage(telegramId, firstName, userText);
        const history = await getConversationHistory(telegramId);
        const longTermMemories = await getUserMemories(telegramId);

        // 🚀 THE NEW ROUTER LOGIC
        const intent = detectFinancialIntent(userText);
        let financialContext = null;

        if (intent.symbol && intent.type !== "GENERAL") {
            console.log(`🔎 Intent: ${intent.type} for ${intent.symbol}`);
            financialContext = await getFinancialIntelligence(intent.symbol, intent.type);
        }

        const aiResponse = await askAtlasAI(userText, history, longTermMemories, financialContext);

        // Safely extract the JSON parts
        const aiReply = aiResponse?.reply || "Sorry, I couldn't generate a useful response.";
        const memories = Array.isArray(aiResponse?.memories) ? aiResponse.memories : [];
        const tickers = Array.isArray(aiResponse?.tickersToWatch) ? aiResponse.tickersToWatch : []; // 🚀 Get the tickers

        await bot.sendMessage(chatID, aiReply);
        await saveAtlasResponse(conversationId, aiReply);
        await saveExtractedMemories(telegramId, memories);
        await saveToWatchlist(telegramId, tickers); // 🚀 Save to database
    } catch (error) {
        console.error("Message Handler Error:", error);
        bot.sendMessage(chatID, "Sorry, I encountered an issue processing your request.");
    }
});

// 🚀 START THE CRON JOB HERE! Pass the 'bot' instance to it.
startProactiveAlerts(bot);

export default app;