# Atlas AI — Financial Intelligence Assistant

> **A proactive financial intelligence assistant that lives inside Telegram.**
>
> Atlas reduces manual financial research by combining conversational memory, multi-source market intelligence, regulatory filings, personalized context, and proactive watchlist monitoring to surface only what actually matters.

---

## 🧠 The Core Idea

Most financial chatbots simply answer questions.

**Atlas is designed to understand the user first, gather the right evidence, and then reason over it.**

When a user asks a financial question, Atlas does not blindly send the message to an AI model. Its backend determines what information is actually required, retrieves relevant financial data from specialized sources, combines that evidence with the user's conversation history and long-term preferences, and then asks Gemini to produce the final response.

This creates a simple intelligence loop:

```text
User Message
     ↓
Understand Intent
     ↓
Retrieve Relevant Financial Evidence
     ↓
Combine With User Memory
     ↓
Gemini Reasoning
     ↓
Personalized Response
     ↓
Learn & Update Memory
```

The result is a financial assistant that becomes more useful over time instead of behaving like a stateless chatbot.

---

## 🎯 Core Philosophy

Finance professionals don't need more information.

They need the **right information, explained in the right context, at the right time.**

Atlas is built around three principles:

1. **Reduce manual research**
2. **Prioritize signal over noise**
3. **Respect the user's attention**

If there is no meaningful event, Atlas should remain silent instead of generating unnecessary notifications.

---

## ⚡ Atlas vs. Typical Financial Chatbots

| Typical Financial Chatbot | Atlas AI |
|---|---|
| Waits for every question | Can proactively monitor important changes |
| Stateless conversations | Persistent short-term and long-term memory |
| Depends on a single source | Multi-source financial evidence |
| Simply returns headlines | Explains **What Happened, Why It Matters, For You** |
| Generic responses | Personalized using user interests and watchlists |
| Notification-heavy | Uses significance thresholds and cooldowns |
| Command-driven interaction | Natural-language conversation |

---

## ✨ Key Capabilities

### 1. Natural Conversational Interaction

Users do not need to learn commands such as `/stock`, `/news`, or `/filing`.

They can simply ask:

> "What's happening with Nvidia today?"

> "Any recent SEC filings for Nvidia?"

> "Why did Nvidia move today?"

Atlas determines what the user is asking and routes the request internally.

---

### 2. Persistent Conversational Memory

Atlas maintains two levels of memory:

- **Short-term memory:** Recent conversation history for multi-turn context.
- **Long-term memory:** User interests, preferences, and important facts extracted from natural conversation.

For example:

```text
User:
I follow Nvidia and AMD and I'm interested in AI infrastructure.

Atlas:
Understood.

Later...

User:
What companies do I follow?

Atlas:
You currently follow Nvidia and AMD.
```

This context is persisted in PostgreSQL rather than existing only inside a single AI request.

---

### 3. Personalized Watchlists

Atlas can identify companies that users explicitly mention following and persist them as watchlist assets.

These watchlists are then used for:

- Personalized financial analysis
- Background monitoring
- Proactive alerts
- User-specific context

This means the assistant gradually becomes more relevant without requiring a large onboarding form.

---

### 4. Multi-Source Financial Intelligence

Atlas does not rely on a single financial data provider.

It combines specialized sources depending on the user's request:

| Source | Purpose |
|---|---|
| **Finnhub** | Market data and stock information |
| **Marketaux** | Financial news and company/entity-related news |
| **SEC EDGAR** | Official regulatory filings |
| **Yahoo Finance** | Additional market-data fallback |

This gives Atlas multiple evidence sources instead of forcing every financial question through one provider.

---

### 5. Intent-Aware Routing

Atlas has a backend intent layer that determines what information is required before calling external services.

Examples:

```text
"What is NVDA's price?"
        ↓
Market Quote
```

```text
"What's the latest Nvidia news?"
        ↓
Financial News
```

```text
"Any recent SEC filings for Nvidia?"
        ↓
SEC Filings
```

```text
"Why did Nvidia move today?"
        ↓
Market Data + News + User Context
```

```text
"How are you?"
        ↓
General Conversation
```

This prevents unnecessary API calls and allows each financial request to use the most relevant data source.

---

### 6. Contextual Financial Reasoning

For market-research questions, Atlas structures its analysis around three questions:

```text
WHAT HAPPENED
     ↓
What changed in the market?

WHY IT MATTERS
     ↓
What does the available evidence suggest?

FOR YOU
     ↓
Why is this relevant to this particular user?
```

For example, if a user has expressed interest in AI infrastructure and asks about Nvidia, Atlas can connect Nvidia's market movement with the user's stored interests rather than returning a generic market summary.

---

### 7. Proactive Intelligence

Atlas does not only wait for users to ask questions.

A background monitoring process checks assets in the user's watchlist and looks for meaningful price movements.

The current demo configuration uses:

```text
Significance threshold: ±3%
Alert cooldown: 6 hours
```

If the movement is not significant, Atlas stays silent.

If the threshold is reached, Atlas can proactively notify the user.

A database-backed `AlertEvent` record prevents repeated notifications for the same asset during the cooldown period, including across application restarts.

---

## 🏗️ System Architecture

```text
                         TELEGRAM USER
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Natural Language  │
                    │       Message       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Intent Router    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        Market Data       Financial News    SEC Filings
       Finnhub / Yahoo      Marketaux        SEC EDGAR
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │  Financial Evidence │
                    │       Layer         │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
       PostgreSQL Memory                   Retrieved Data
       ├─ Conversation History                  │
       ├─ Long-Term Memories                    │
       ├─ Watchlists                            │
       └─ Alert Events                          │
              │                                 │
              └────────────────┬────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │     Gemini AI       │
                    │  Reasoning Layer    │
                    └──────────┬──────────┘
                               │
                               ▼
                    Personalized Telegram
                         Response
```

---

## 🛠️ Tech Stack

### Backend

- Node.js
- Express.js
- ES Modules
- Google Gemini API
- Prisma ORM
- PostgreSQL
- Docker

### Telegram

- `node-telegram-bot-api`

### Background Processing

- `node-cron`

### Financial Intelligence

- Finnhub API
- Marketaux API
- SEC EDGAR API
- Yahoo Finance via `yahoo-finance2`

### Development

- Git
- GitHub
- Nodemon

---

## 🗄️ Data Model

Atlas uses PostgreSQL with Prisma ORM to persist user context and application state.

| Model | Purpose |
|---|---|
| **User** | Telegram identity and user metadata |
| **Conversation / Message** | Recent conversation history for short-term context |
| **ExtractedMemory** | Long-term facts and preferences learned from conversation |
| **Watchlist** | Companies/assets explicitly followed by the user |
| **AlertEvent** | Proactive notification history and cooldown tracking |

### Example Long-Term Memories

```text
User follows Nvidia
User is interested in AI infrastructure
User prefers concise responses
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Financial APIs
FINNHUB_API_KEY=your_finnhub_api_key
MARKETAUX_API_KEY=your_marketaux_api_key

# SEC
SEC_USER_AGENT="AtlasAI your-email@example.com"

# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/atlas_db?schema=public"
```

> **Never commit `.env` or API keys to GitHub.**

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/jhasaurav97/atlas-ai-financial-assistant.git
cd atlas-ai-financial-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start PostgreSQL

If using the included Docker configuration:

```bash
docker compose up -d
```

### 4. Configure Environment Variables

Create `.env` and add the required:

- Telegram bot token
- Gemini API key
- Finnhub API key
- Marketaux API key
- SEC User-Agent
- PostgreSQL connection string

### 5. Run Prisma Migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Start Atlas

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Once the server is running, open the Telegram bot and start asking financial questions naturally.

---

## 🎬 Demo Flow

The following conversation demonstrates the main Atlas intelligence loop.

### 1. Establish User Context

```text
I follow Nvidia and AMD and I'm interested in AI infrastructure.
```

### 2. Test Long-Term Memory

```text
What companies do I follow?
```

Atlas should retrieve the stored context rather than treating the message as a completely new conversation.

### 3. Retrieve Market Data

```text
What is the current price of NVDA?
```

### 4. Retrieve Financial News

```text
What's the latest news for Nvidia?
```

### 5. Retrieve Regulatory Information

```text
Any recent SEC filings for Nvidia?
```

### 6. Cross-Source Financial Reasoning

```text
Why did Nvidia move today?
```

This demonstrates Atlas combining available market information, financial news, regulatory context, and user memory to produce a personalized analysis.

### 7. Proactive Intelligence

Leave the bot running with a populated watchlist.

Atlas's background monitor checks for significant movements and sends an alert when the configured threshold is reached.

The alert cooldown prevents repeated notifications from becoming spam.

---

## 💡 Why Atlas Is Different

Atlas is intentionally not designed as another generic "ask AI about stocks" bot.

Its intelligence comes from the **orchestration layer around the AI model**:

```text
                         Gemini
                           ▲
                           │
                  Reasoning + Synthesis
                           │
              ┌────────────┴────────────┐
              │                         │
       Financial Evidence         User Context
              │                         │
       ┌──────┼──────┐            ┌────┴────┐
       │      │      │            │         │
    Finnhub Marketaux SEC      Memory   Watchlist
              │
              ▼
         Atlas Backend
```

The model is only one part of the system.

The backend decides:

- **What the user is asking**
- **Which data source is relevant**
- **What user context matters**
- **What information should be sent to the AI**
- **When the assistant should proactively speak**
- **When it should remain silent**

That is what turns Atlas from a simple chatbot into a **financial intelligence system**.

---

## 🔮 Future Improvements

The current implementation focuses on the highest-value financial intelligence workflow.

Potential future extensions include:

- Telegram voice-message transcription and analysis
- Financial document and PDF intelligence
- Earnings-call summarization
- Portfolio-level risk analysis
- More sophisticated event detection
- Additional market-data providers
- Persistent user notification preferences
- Cloud-native background job processing
- More advanced alert prioritization

These extensions can be added without replacing the existing intelligence pipeline.

---

## ⚠️ Disclaimer

Atlas AI is a software demonstration and is **not a financial advisor**.

Market data may be delayed or subject to third-party provider limitations. Users should independently verify financial information before making investment decisions.

---

## 👨‍💻 Built By

**Saurav Jha**

Full Stack Developer focused on building practical, intelligent backend systems with Node.js, React, PostgreSQL, APIs, and AI.

**Repository:**  
https://github.com/jhasaurav97/atlas-ai-financial-assistant
