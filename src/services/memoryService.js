import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Ensure User & Save ONLY the User's Message First
export const saveUserMessage = async (telegramId, firstName, userText) => {
    try {
        let user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: BigInt(telegramId),
                    firstName: firstName || "User"
                }
            });
            console.log(`🌟 New User Registered: ${firstName}`);
        }

        let conversation = await prisma.conversation.findFirst({
            where: { userId: user.id },
            orderBy: { sessionDate: 'desc' }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: { userId: user.id }
            });
        }

        // Save only the user's message
        await prisma.message.create({
            data: { conversationId: conversation.id, role: 'user', content: userText }
        });

        // Return conversationId so we know where to save the AI response later
        return conversation.id;
    } catch (error) {
        console.error("❌ Error saving user message:", error.message);
        return null;
    }
};

// 2. Save Atlas's Response later
export const saveAtlasResponse = async (conversationId, aiText) => {
    if (!conversationId) return;
    try {
        await prisma.message.create({
            data: { conversationId: conversationId, role: 'atlas', content: aiText }
        });
        console.log(`✅ Chat cycle successfully saved!`);
    } catch (error) {
        console.error("❌ Error saving AI response:", error.message);
    }
};

// 3. Fetch History (Same as before)
export const getConversationHistory = async (telegramId, limit = 10) => {
    try {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) }
        });
        if (!user) return [];

        const conversation = await prisma.conversation.findFirst({
            where: { userId: user.id },
            orderBy: { sessionDate: 'desc' }
        });
        if (!conversation) return [];

        const recentMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return recentMessages.reverse();
    } catch (error) {
        console.error("❌ Error fetching history:", error.message);
        return [];
    }
};

// 4. Add this at the bottom of memoryService.js
export const saveExtractedMemories = async (telegramId, memories = []) => {
    if (!memories || memories.length === 0) return;

    try {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) }
        });

        if (!user) return;

        for (const memory of memories) {
            // 🛡️ Safety check: Ensure Gemini didn't send empty objects
            if (!memory?.category || !memory?.fact) continue;

            try {
                await prisma.extractedMemory.create({
                    data: {
                        userId: user.id,
                        category: memory.category.trim(),
                        fact: memory.fact.trim()
                    }
                });
                console.log(`🧠 New Memory Saved: [${memory.category}] ${memory.fact}`);
            } catch (error) {
                if (error.code === "P2002") {
                    console.log(`🔄 Memory already exists (Skipped): ${memory.fact}`);
                } else {
                    console.error("❌ Memory save error:", error.message);
                }
            }
        }
    } catch (error) {
        console.error("❌ Error in saveExtractedMemories:", error.message);
    }
};

// 5. 🚀 Fetch Long-Term Memories (The missing piece!)
export const getUserMemories = async (telegramId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) }
        });
        if (!user) return [];

        const memories = await prisma.extractedMemory.findMany({
            where: { userId: user.id },
            select: { fact: true }
        });

        return memories.map(m => m.fact);
    } catch (error) {
        console.error("❌ Error fetching user memories:", error.message);
        return [];
    }
};

// 🚀 Save explicit tickers to the Watchlist table
export const saveToWatchlist = async (telegramId, tickers = []) => {
    if (!tickers || tickers.length === 0) return;

    try {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) }
        });
        if (!user) return;

        for (const symbol of tickers) {
            const ticker = symbol.toUpperCase().trim();

            // Check if it's already in the watchlist so we don't duplicate
            const existing = await prisma.watchlist.findFirst({
                where: { userId: user.id, assetSymbol: ticker }
            });

            if (!existing) {
                await prisma.watchlist.create({
                    data: {
                        userId: user.id,
                        assetSymbol: ticker,
                        assetType: 'stock'
                    }
                });
                console.log(`📈 Added ${ticker} to Watchlist!`);
            }
        }
    } catch (error) {
        console.error("❌ Error in saveToWatchlist:", error.message);
    }
};
