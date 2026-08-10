# Atlas AI — Financial Intelligence Assistant

> **A proactive financial intelligence assistant that lives inside Telegram.**
>
> Atlas is designed to help finance professionals spend less time searching, reading, comparing, and monitoring financial information. Instead of behaving like a generic chatbot or forwarding financial news, Atlas combines conversational memory, multi-source financial data, regulatory filings, personalized context, and proactive watchlist monitoring to surface what actually matters.

---

## Why Atlas?

Financial professionals often have to switch between multiple sources to answer a simple question:

- What happened to a company today?
- Why did the stock move?
- Was there a new filing?
- What is the latest relevant news?
- Does this matter to the companies or sectors I follow?
- Should I be notified about this movement?

Atlas brings that workflow into a single conversational interface.

The goal is **not to provide the most information**.

The goal is to provide the **right information at the right time**.

Atlas follows three core principles:

1. **Reduce manual work**
2. **Prioritize signal over noise**
3. **Respect the user's attention**

If nothing important happened, Atlas should be comfortable staying silent.

---

# What Atlas Does

Atlas understands natural-language financial requests such as:

> "What is the current price of Nvidia?"

> "What's the latest news about Nvidia?"

> "Any recent SEC filings for Nvidia?"

> "Why did Nvidia move today?"

> "I follow Apple and Microsoft."

> "What companies do I follow?"

> "Track Tesla and notify me when something important happens."

The user does not need to remember commands, navigate menus, or learn a predefined workflow.

Atlas determines what information is required, retrieves the relevant evidence, combines it with the user's context, and produces a concise response.

---

# Key Capabilities

## 1. Natural Conversational Interaction

Atlas is designed around natural language rather than command-driven workflows.

Users can simply ask questions as they would ask a financial colleague.

There are no financial slash commands such as:

```text
/stock NVDA
/news NVDA
/sec NVDA
```

Instead:

```text
"What's happening with Nvidia today?"
```

is enough.

The backend determines the user's intent and selects the appropriate data sources.

---

## 2. Persistent Conversational Memory

Atlas remembers relevant context instead of treating every message as an isolated request.

### Short-term memory

Recent conversation history is stored in PostgreSQL and supplied to the AI when context is required.

This allows conversations such as:

```text
User: Tell me about Nvidia.

Atlas: ...

User: Why did it move today?

Atlas: ...
```

to remain connected without requiring the user to repeat the company name.

### Long-term memory

Atlas can extract meaningful user information from natural conversation.

For example:

```text
User:
I mainly follow Nvidia and AMD and I'm interested in AI infrastructure.
```

Atlas can persist relevant information such as:

```text
User follows Nvidia
User follows AMD
User is interested in AI infrastructure
```

The information is stored in PostgreSQL rather than being kept only inside the current AI context.

This allows Atlas to become more useful over time.

---

# 3. Personalized Watchlists

Users can naturally express what they follow:

```text
"I follow Nvidia, Apple and Microsoft."
```

Atlas can identify the relevant assets and maintain a persistent watchlist.

The watchlist is then used by other parts of the system.

For example, if Nvidia moves significantly, Atlas can connect the event to the user's existing interest rather than treating the event as generic market information.

---

# 4. Multi-Source Financial Intelligence

Atlas does not depend on a single financial data source.

Different sources are used for different types of evidence.

### Market Data

**Finnhub**

Used for market and company-level financial data.

### Financial News

**Marketaux**

Used for recent financial news and company/entity-related market coverage.

### Regulatory Information

**SEC EDGAR**

Used as the authoritative source for U.S. regulatory filings.

Examples include:

- 10-K
- 10-Q
- 8-K
- Form 3
- Form 4
- Schedule 13D / 13G

### Fallback Market Data

**Yahoo Finance**

Provides an additional market-data path when appropriate.

This multi-source approach improves resilience and gives Atlas access to different forms of evidence rather than relying on one feed.

---

# 5. Intent-Aware Data Retrieval

Atlas does not blindly call every API for every message.

The backend first determines what the user is asking for.

For example:

```text
"What is NVDA's price?"
        ↓
Market Quote Intent
        ↓
Fetch market data
        ↓
Generate concise answer
```

While:

```text
"Any recent SEC filings for Nvidia?"
        ↓
SEC Filing Intent
        ↓
Fetch regulatory data
        ↓
Summarize relevant filings
```

And:

```text
"What companies do I follow?"
        ↓
Memory / Watchlist Intent
        ↓
Read PostgreSQL
        ↓
Return personalized context
```

This keeps unnecessary API calls and AI processing to a minimum.

---

# 6. Contextual Financial Analysis

Atlas does more than return raw financial data.

For market-movement and research questions, the response is structured around three questions:

### WHAT HAPPENED

What changed?

### WHY IT MATTERS

Why is the development relevant?

### FOR YOU

Why might this matter specifically to this user based on their interests and watchlist?

For example:

```text
WHAT HAPPENED:
Nvidia moved higher based on the latest available market data and
relevant AI infrastructure news.

WHY IT MATTERS:
The move is relevant because investors are continuing to evaluate
AI infrastructure demand and semiconductor valuations.

FOR YOU:
Because you follow AI infrastructure companies, this development
is relevant to the broader companies and supply chain you track.
```

This transforms raw data into decision-oriented context.

---

# 7. Proactive Intelligence

Atlas does not only wait for the user to ask a question.

It can monitor persisted watchlists in the background.

The monitoring engine evaluates watchlist assets and checks whether a meaningful price movement has occurred.

The current significance threshold is:

```text
±3%
```

An alert is generated only when the movement reaches the configured threshold.

This is intentional.

Atlas is not designed to send:

```text
"Your stock moved 0.2%."
```

every few minutes.

Instead, the product principle is:

> **No meaningful event = no notification.**

---

# 8. Alert Deduplication

Proactive systems can easily become noisy.

Atlas therefore maintains alert history in PostgreSQL.

The system uses persisted alert events and a cooldown mechanism to prevent the same asset from repeatedly generating the same notification within the configured cooldown period.

This means the alert system remains useful even when:

- the server restarts
- the monitoring cycle runs repeatedly
- the same stock remains above the alert threshold

The objective is simple:

**Alert the user when something matters, not whenever the monitoring loop runs.**

---

# 9. Telegram-Native Experience

Telegram is used as the primary user interface.

The backend handles:

```text
User Message
     ↓
Intent Detection
     ↓
Context Retrieval
     ↓
Financial Data Retrieval
     ↓
AI Reasoning
     ↓
Concise Response
     ↓
Telegram
```

The user does not need to understand the underlying services.

The complexity stays inside the backend.

---

# System Architecture

```text
                           TELEGRAM USER
                                │
                                ▼
                     Natural Language Message
                                │
                                ▼
                    ┌────────────────────────┐
                    │      Atlas Backend     │
                    │      Node.js/Express   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │   Intent Router   │
                       └─────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        Market Data          Financial News      SEC Filings
        Finnhub/Yahoo          Marketaux          SEC EDGAR
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
                       Normalized Evidence
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
        PostgreSQL Context                 Gemini AI
        ├─ Users                           ├─ Reasoning
        ├─ Conversations                   ├─ Synthesis
        ├─ Messages                        └─ Response
        ├─ Long-term Memories
        ├─ Watchlists
        └─ Alert Events
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                       Personalized Response
                                 │
                                 ▼
                            TELEGRAM USER


             ┌──────────────────────────────────┐
             │     Background Intelligence      │
             │                                  │
             │       node-cron                  │
             │            │                     │
             │            ▼                     │
             │       User Watchlists            │
             │            │                     │
             │            ▼                     │
             │       Market Movement             │
             │            │                     │
             │            ▼                     │
             │     Threshold + Cooldown          │
             │            │                     │
             │      Meaningful Event?            │
             │         /          \               │
             │       YES           NO             │
             │        │             │             │
             │        ▼             ▼             │
             │      Alert         Stay Silent     │
             └──────────────────────────────────┘
```

---

# Why Atlas Is Different

Atlas is not designed to be another ChatGPT wrapper inside Telegram.

The distinction is in the workflow.

| Typical Financial Chatbot | Atlas |
|---|---|
| Waits for every question | Can proactively monitor important changes |
| Stateless conversations | Persistent conversational memory |
| Generic responses | Personalized responses |
| Single data source | Multi-source financial evidence |
| Forwards headlines | Explains why information matters |
| Sends frequent notifications | Uses significance thresholds and cooldowns |
| Requires commands | Natural-language interaction |
| Treats every user the same | Learns relevant user interests |
| Returns raw data | Converts data into useful context |
| Optimizes for feature count | Optimizes for user time |

### The central difference

Atlas is built around one question:

> **"Does this information actually help this user right now?"**

If the answer is no, Atlas should not add more noise.

---

# Example User Experience

### User Interest

```text
User:
I mainly follow Nvidia and AMD and I'm interested in AI infrastructure.
```

Atlas learns the relevant context.

---

### Memory

```text
User:
What companies do I follow?

Atlas:
You currently follow Nvidia and AMD.
```

The answer is generated from persistent application memory.

---

### Live Market Question

```text
User:
What is the current price of NVDA?
```

Atlas retrieves the latest available market data rather than inventing a number.

---

### News Research

```text
User:
What's the latest news for Nvidia?
```

Atlas retrieves relevant financial news and summarizes the information instead of simply forwarding headlines.

---

### Regulatory Research

```text
User:
Any recent SEC filings for Nvidia?
```

Atlas checks the regulatory data source and returns relevant recent filings.

---

### Market-Movement Analysis

```text
User:
Why did Nvidia move today?
```

Atlas combines available market data, relevant financial information, and the user's stored context to produce a concise explanation.

---

### Proactive Intelligence

The user does not need to ask:

```text
"Check my watchlist."
```

Atlas can monitor it in the background.

If an important movement occurs:

```text
🔔 Atlas Market Alert

Atlas noticed a significant move in a company you follow.

Marvell Technology (MRVL) is up 3.89% today.

Current Price: $218.72
```

If the movement is not meaningful:

```text
No notification.
```

That silence is intentional.

---

# Data & Memory Model

Atlas uses PostgreSQL with Prisma ORM.

## User

Stores the Telegram identity and basic user information.

```text
User
 ├── telegramId
 ├── firstName
 └── createdAt
```

## Conversation

Groups messages into conversational sessions.

```text
User
 └── Conversation
       └── Messages
```

## Message

Stores the actual conversation history.

```text
Message
 ├── role
 ├── content
 └── createdAt
```

## ExtractedMemory

Stores useful long-term user information.

```text
ExtractedMemory
 ├── category
 ├── fact
 └── createdAt
```

Examples:

```text
interest → User is interested in AI infrastructure
preference → User prefers concise answers
interest → User follows semiconductor companies
```

## Watchlist

Stores assets the user explicitly follows.

```text
Watchlist
 ├── assetSymbol
 ├── assetType
 └── addedAt
```

## AlertEvent

Stores proactive notifications and supports cooldown/deduplication.

```text
AlertEvent
 ├── assetSymbol
 ├── alertType
 ├── changePercent
 └── triggeredAt
```

---

# Technology Stack

### Backend

- Node.js
- Express.js
- ES Modules

### AI

- Google Gemini API
- Structured AI responses
- Context-aware prompt orchestration

### Database

- PostgreSQL
- Prisma ORM

### Financial Intelligence

- Finnhub
- Marketaux
- SEC EDGAR
- Yahoo Finance

### Telegram

- node-telegram-bot-api

### Background Processing

- node-cron

### Infrastructure

- Docker
- Google Cloud
- Cloud Run
- Cloud SQL PostgreSQL

---

# Project Structure

```text
atlas-ai-financial-assistant/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── app.js
│   ├── index.js
│   │
│   └── services/
│       ├── aiService.js
│       ├── cronService.js
│       ├── financialDataService.js
│       ├── financialService.js
│       ├── intentService.js
│       └── memoryService.js
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── package-lock.json
└── prisma.config.ts
```

---

# Local Development

## Requirements

- Node.js
- npm
- Docker Desktop
- PostgreSQL through Docker
- Telegram Bot Token
- Gemini API Key
- Finnhub API Key
- Marketaux API Key

---

## 1. Clone

```bash
git clone https://github.com/jhasaurav97/atlas-ai-financial-assistant.git
cd atlas-ai-financial-assistant
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a `.env` file in the project root.

Use `.env.example` as the reference.

```env
PORT=3000

TELEGRAM_BOT_TOKEN=your_telegram_bot_token

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_configured_gemini_model

FINNHUB_API_KEY=your_finnhub_api_key
MARKETAUX_API_KEY=your_marketaux_api_key

SEC_USER_AGENT="AtlasAI your-email@example.com"

DATABASE_URL="postgresql://username:password@localhost:5432/atlas_db?schema=public"
```

**Never commit `.env` or API keys to GitHub.**

---

## 4. Start PostgreSQL

If using the included Docker setup:

```bash
docker compose up -d
```

Verify the containers are running:

```bash
docker compose ps
```

---

## 5. Apply Prisma migrations

```bash
npx prisma migrate dev
```

Generate the Prisma client:

```bash
npx prisma generate
```

---

## 6. Start Atlas

```bash
npm run dev
```

Atlas should now connect to Telegram and begin processing messages.

---

# Environment Security

Atlas keeps credentials outside the source code.

Sensitive values include:

```text
TELEGRAM_BOT_TOKEN
GEMINI_API_KEY
FINNHUB_API_KEY
MARKETAUX_API_KEY
DATABASE_URL
```

These values belong in environment variables and must never be committed to source control.

The repository includes:

```text
.env.example
```

so the required configuration remains clear without exposing credentials.

---

# Reliability & Resilience

Atlas is designed to avoid depending on a single component for every workflow.

### Multiple financial sources

Different sources are used for different types of financial evidence.

### Graceful AI failures

AI/API failures return a controlled response instead of crashing the Telegram message handler.

### Persistent database state

User memory, watchlists, conversations, and alert events survive application restarts.

### Alert cooldown

The proactive monitor uses persisted alert history to reduce repeated notifications.

### Intent-based retrieval

The backend retrieves information according to the user's request rather than querying every source for every message.

### Silence as a valid result

The monitoring system can intentionally produce no user-facing notification when an event does not meet the significance threshold.

---

# Product Design Philosophy

Atlas deliberately avoids feature overload.

The product is based on a simple principle:

> **Every interaction should save the user time.**

Therefore Atlas prioritizes:

- concise answers
- relevant information
- contextual explanations
- natural conversation
- persistent useful memory
- personalized insights
- meaningful proactive alerts

Instead of:

- excessive reports
- unnecessary notifications
- command-heavy workflows
- long generic summaries
- information that does not affect the user's decision

---

# Current Scope

The current implementation focuses on the highest-value financial assistant workflows:

### Implemented

- Telegram conversational interface
- Natural-language interaction
- Persistent users
- Short-term conversation memory
- Long-term extracted memory
- Persistent watchlists
- Intent-based routing
- Market quote retrieval
- Financial news retrieval
- SEC filing retrieval
- Multi-source financial context
- Personalized financial responses
- Market-movement analysis
- Proactive watchlist monitoring
- Significance threshold alerts
- Alert cooldown/deduplication
- PostgreSQL persistence
- Prisma migrations
- Docker-based local database
- Google Cloud deployment architecture

---

# Future Expansion

Atlas is intentionally designed so additional capabilities can be added without changing the core product model.

Potential extensions include:

### Voice Intelligence

Allow users to send Telegram voice messages and convert them into financial queries.

### Document Intelligence

Allow users to upload:

- annual reports
- earnings presentations
- financial models
- SEC documents
- research PDFs

and ask questions directly about the uploaded material.

### Earnings Intelligence

Automatically summarize earnings calls and highlight:

- guidance changes
- management commentary
- risks
- opportunities
- sentiment changes

### Personalized Daily Briefings

Generate a concise morning briefing based on the user's actual watchlist and interests.

The briefing would be selective rather than a generic news dump.

### Calendar & Email Intelligence

Connect relevant work context such as:

- earnings calls
- investor meetings
- company-related emails
- research documents

and surface only information that helps the user prepare or act.

---

# Demo Flow

The recommended demonstration follows the actual product journey.

## 1. Introduce Atlas

Show Atlas inside Telegram and explain:

> "Atlas is designed as a proactive financial intelligence assistant, not a generic chatbot."

---

## 2. Establish User Context

Tell Atlas:

```text
I follow Nvidia and AMD and I'm interested in AI infrastructure.
```

---

## 3. Prove Memory

Ask:

```text
What companies do I follow?
```

Atlas retrieves the persisted context.

---

## 4. Ask for Live Market Data

Ask:

```text
What is the current price of NVDA?
```

Show the financial data retrieval.

---

## 5. Ask for Research

Ask:

```text
What's the latest news for Nvidia?
```

Show the multi-source financial research response.

---

## 6. Ask for Regulatory Information

Ask:

```text
Any recent SEC filings for Nvidia?
```

Show the regulatory filing lookup.

---

## 7. Ask for Analysis

Ask:

```text
Why did Nvidia move today?
```

Show:

```text
WHAT HAPPENED
WHY IT MATTERS
FOR YOU
```

This demonstrates that Atlas is synthesizing information rather than simply forwarding a quote.

---

## 8. Demonstrate Proactive Intelligence

Show the watchlist monitor running in the background.

Explain:

> "Atlas doesn't notify me every time a price changes. It checks whether the movement is meaningful and uses persistent cooldown state to avoid notification spam."

Then demonstrate a qualifying alert.

---

# Why This Architecture Matters

The important part of Atlas is not any individual API.

It is the orchestration between them.

```text
Conversation
      +
User Memory
      +
Watchlist
      +
Intent
      +
Market Data
      +
Financial News
      +
Regulatory Evidence
      +
AI Reasoning
      +
Proactive Monitoring
      =
Personalized Financial Intelligence
```

This is what turns Atlas from a Telegram chatbot into an assistant designed around a real financial workflow.

---

# Disclaimer

Atlas is a software demonstration for financial information and research workflows.

Market data can be delayed or unavailable, and financial information may contain errors or omissions.

Atlas is **not a financial advisor** and should not be treated as a substitute for professional financial advice or independent verification.

---

# License

This project was created as a hackathon project and demonstration of an AI-powered financial intelligence workflow.
