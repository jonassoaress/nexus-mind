# Product Requirements Document: NexusMind

**Product:** NexusMind (Universal Context Aggregator)
**Stage:** MVP (Minimum Viable Product)
**Target:** Local-first iOS/Android App

## 1. Executive Summary
**Vision:** Transform how we consume, store, and retrieve daily information, eliminating organization fatigue and the anxiety of "saving for later".
**Mission:** Build the smartest, privacy-focused "Second Brain", requiring zero input friction and delivering surgical precision in retrieval using on-device AI.

## 2. Target Audience & Use Cases
- **Audience:** Knowledge workers, students, neurodivergent individuals (e.g., ADHD) suffering from digital hoarding.
- **Journey 1 (Passive Screenshots):** Takes a screenshot of a book -> App OCRs & tags it in background -> User searches "book I screenshot in Feb" -> AI returns exact image.
- **Journey 2 (Share Links):** Shares TikTok video -> App scrapes/summarizes offline -> User asks "Excel formula from TikTok" -> AI provides text formula.
- **Journey 3 (Voice Memos):** Records voice -> App transcribes, summarizes, and extracts Action Items automatically.

## 3. MVP Scope
**In Scope:**
- Capture via OS Share Sheet and Background Screenshots.
- **100% On-Device AI:** Apple Intelligence / Android AICore / Local SLMs for all reasoning, tagging, and summarizing.
- Conversational UI / Semantic Vector Search.
**Out of Scope:** Cloud Sync, Heavy YouTube scraping, Autonomous Agents (executing external tasks).

## 4. Non-Functional Requirements
- **Absolute Privacy (Strict On-Device):** 100% of text extraction, embedding generation, and semantic summarization must occur locally. NO CLOUD APIs allowed.
- **Battery:** Background watcher must batch operations.
- **Performance:** Semantic search latency < 1.5s. Main JS thread must remain unblocked during AI inference. App must gracefully fallback to smaller SLMs if the device lacks native OS AI capabilities.

## 5. Success Metrics (KPIs)
- **Time-to-Value:** Search retrieval < 2 seconds.
- **Search CTR:** > 75% of semantic searches resolve the user's intent without query reformulation.
- **Retention:** D1 > 45%, D7 > 30%.
