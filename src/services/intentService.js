const STOCK_SYMBOLS = { nvidia: "NVDA", apple: "AAPL", microsoft: "MSFT", amd: "AMD", tesla: "TSLA", google: "GOOGL", meta: "META" };

export const detectFinancialIntent = (text = "") => {
    const normalized = text.toLowerCase();
    const company = Object.keys(STOCK_SYMBOLS).find(name => normalized.includes(name));
    const symbol = company ? STOCK_SYMBOLS[company] : null;

    if (!symbol) return { type: "GENERAL", symbol: null };

    if (/\b(why|reason|what caused|moving|moved)\b/i.test(normalized)) return { type: "WHY_MOVED", symbol };
    if (/\b(news|happening|latest|update)\b/i.test(normalized)) return { type: "COMPANY_NEWS", symbol };
    if (/\b(filing|sec|10-k|10-q|8-k|report)\b/i.test(normalized)) return { type: "SEC_FILINGS", symbol };
    if (/\b(current|today|price|stock price|quote)\b/i.test(normalized)) return { type: "STOCK_QUOTE", symbol };

    return { type: "COMPANY_RESEARCH", symbol };
};