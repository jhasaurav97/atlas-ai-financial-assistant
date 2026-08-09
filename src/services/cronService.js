import cron from 'node-cron';
import { getStockQuote } from './financialService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 6 hours cooldown in milliseconds
const COOLDOWN_MS = 6 * 60 * 60 * 1000;

export const startProactiveAlerts = (bot) => {

    // Runs every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log("⏰ Running Smart Watchlist Monitor...");

        try {
            const users = await prisma.user.findMany({
                include: { watchlists: true }
            });

            for (const user of users) {
                if (!user.watchlists || user.watchlists.length === 0) continue;

                for (const item of user.watchlists) {
                    const symbol = item.assetSymbol.toUpperCase();

                    // 🛡️ PERSISTENT DEDUPLICATION CHECK via PostgreSQL
                    const sixHoursAgo = new Date(Date.now() - COOLDOWN_MS);
                    const recentAlert = await prisma.alertEvent.findFirst({
                        where: {
                            userId: user.id,
                            assetSymbol: symbol,
                            alertType: 'PRICE_MOVEMENT',
                            triggeredAt: { gte: sixHoursAgo }
                        }
                    });

                    if (recentAlert) {
                        console.log(`⏭️ Duplicate alert skipped (cooldown active): ${symbol}`);
                        continue;
                    }

                    const quote = await getStockQuote(symbol);

                    if (quote && quote.changePercent !== null) {
                        const threshold = 3.0; // 3% threshold

                        if (Math.abs(quote.changePercent) >= threshold) {

                            const direction = quote.changePercent > 0 ? "up 📈" : "down 📉";
                            const message = `🔔 **Atlas Market Alert**\n\nAtlas noticed a significant move in a company you follow.\n\n**${quote.companyName} (${quote.symbol})** is ${direction} **${quote.changePercent}%** today.\n\nCurrent Price: $${quote.price}\n\nWould you like me to investigate why this is happening?`;

                            // Send to Telegram
                            await bot.sendMessage(Number(user.telegramId), message, { parse_mode: 'Markdown' });
                            console.log(`✅ Meaningful alert sent to ${user.firstName} for ${symbol}`);

                            // 💾 SAVE TO DATABASE AFTER SUCCESSFUL SEND
                            await prisma.alertEvent.create({
                                data: {
                                    userId: user.id,
                                    assetSymbol: symbol,
                                    alertType: 'PRICE_MOVEMENT',
                                    changePercent: parseFloat(quote.changePercent)
                                }
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("❌ Cron Job Error:", error.message);
        }
    });

    console.log("⏱️ Smart Proactive Monitor Started! (Threshold: >3%, 6h Persistent Cooldown Enabled)");
};