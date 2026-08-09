import YahooFinance from "yahoo-finance2";

// 🛠️ The Fix: Create a new instance as required by V4
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// 1. Fetch Live Stock Quote
export const getStockQuote = async (symbol) => {
    try {
        const quote = await yahooFinance.quote(symbol);

        if (!quote) return null;

        return {
            symbol: quote.symbol,
            companyName: quote.longName || quote.shortName || quote.symbol,
            price: quote.regularMarketPrice ?? null,
            currency: quote.currency || "USD",
            change: quote.regularMarketChange ?? null,
            changePercent: quote.regularMarketChangePercent ?? null,
            dayHigh: quote.regularMarketDayHigh ?? null,
            dayLow: quote.regularMarketDayLow ?? null,
            marketState: quote.marketState ?? null
        };
    } catch (error) {
        console.error(`❌ Financial quote error for ${symbol}:`, error.message);
        return null;
    }
};

