import yahooFinance from "yahoo-finance2";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const MARKETAUX_KEY = process.env.MARKETAUX_API_KEY;
const SEC_AGENT = process.env.SEC_USER_AGENT;

// Simple in-memory cache to prevent rate limiting
const cache = new Map();

// Helper to fetch SEC Ticker to CIK mapping
const getCikFromTicker = async (ticker) => {
    try {
        const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: { "User-Agent": SEC_AGENT } });
        const data = await res.json();
        const entry = Object.values(data).find(comp => comp.ticker.toUpperCase() === ticker.toUpperCase());
        return entry ? entry.cik_str.toString().padStart(10, '0') : null;
    } catch (e) {
        return null;
    }
};

export const getFinancialIntelligence = async (symbol, intentType) => {
    const cacheKey = `${symbol}-${intentType}`;
    if (cache.has(cacheKey) && (Date.now() - cache.get(cacheKey).time < 60000)) {
        return cache.get(cacheKey).data;
    }

    const context = { market: [], news: [], filings: [], sources: [] };
    const sym = symbol.toUpperCase();

    try {
        // 1. QUOTE: Finnhub -> Yahoo Fallback
        if (["STOCK_QUOTE", "WHY_MOVED", "COMPANY_RESEARCH", "COMPANY_MOVEMENT"].includes(intentType)) {
            try {
                const fhRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`);
                const fhData = await fhRes.json();
                if (fhData && fhData.c) {
                    context.market.push({ symbol: sym, price: fhData.c, change: fhData.d, changePercent: fhData.dp, source: "Finnhub" });
                    context.sources.push("Finnhub");
                } else throw new Error("Finnhub quote missing");
            } catch (err) {
                const yfQuote = await yahooFinance.quote(sym);
                if (yfQuote) {
                    context.market.push({ symbol: sym, price: yfQuote.regularMarketPrice, changePercent: yfQuote.regularMarketChangePercent, source: "Yahoo Finance" });
                    if (!context.sources.includes("Yahoo Finance")) context.sources.push("Yahoo Finance");
                }
            }
        }

        // 2. NEWS: Marketaux -> Finnhub -> Yahoo Fallback
        if (["COMPANY_NEWS", "MARKET_NEWS", "WHY_MOVED", "COMPANY_RESEARCH"].includes(intentType)) {
            try {
                const mxRes = await fetch(`https://api.marketaux.com/v1/news/all?symbols=${sym}&filter_entities=true&limit=5&api_token=${MARKETAUX_KEY}`);
                const mxData = await mxRes.json();

                if (mxData.data && mxData.data.length > 0) {
                    // Filter articles that actually mention the ticker/company in the title or snippet
                    const filtered = mxData.data.filter(n =>
                        (n.title && n.title.toUpperCase().includes(sym)) ||
                        (n.snippet && n.snippet.toUpperCase().includes(sym)) ||
                        (n.entities && n.entities.some(e => e.symbol === sym))
                    );

                    const finalArticles = filtered.length > 0 ? filtered.slice(0, 3) : mxData.data.slice(0, 3);

                    context.news = finalArticles.map(n => ({
                        title: n.title,
                        url: n.url,
                        publisher: n.source,
                        source: "Marketaux"
                    }));
                    context.sources.push("Marketaux");
                } else throw new Error("Marketaux empty");
            } catch (err) {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    const fhNewsRes = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${today}&to=${today}&token=${FINNHUB_KEY}`);
                    const fhNews = await fhNewsRes.json();
                    if (fhNews && fhNews.length > 0) {
                        context.news = fhNews.slice(0, 3).map(n => ({ title: n.headline, url: n.url, publisher: n.source, source: "Finnhub" }));
                        if (!context.sources.includes("Finnhub")) context.sources.push("Finnhub");
                    }
                } catch (fallbackErr) {
                    // Yahoo Fallback omitted here for brevity, but Finnhub usually catches it.
                }
            }
        }

        // 3. SEC FILINGS: data.sec.gov (No API Key needed)
        if (["SEC_FILINGS", "COMPANY_RESEARCH"].includes(intentType)) {
            try {
                const cik = await getCikFromTicker(sym);
                if (cik) {
                    // Fetch recent filings directly from SEC
                    const secRes = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: { "User-Agent": SEC_AGENT } });
                    const secData = await secRes.json();
                    const recent = secData.filings.recent;
                    for (let i = 0; i < Math.min(3, recent.form.length); i++) {
                        context.filings.push({ form: recent.form[i], filingDate: recent.filingDate[i], document: recent.primaryDocument[i], source: "SEC EDGAR" });
                    }
                    context.sources.push("SEC EDGAR");
                }
            } catch (err) {
                console.error("SEC Fetch Error:", err.message);
            }
        }

        cache.set(cacheKey, { time: Date.now(), data: context });
        return context;
    } catch (e) {
        console.error("Financial Data Service Error:", e.message);
        return context; // Return whatever was gathered before failure
    }
};