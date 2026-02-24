# NexusMind - AI Agents Architecture (Definitive 100% Local)

This document defines the pipelines and system prompts for the on-device AI processing agents. **No cloud APIs are allowed under any circumstances.**

## 1. The Vision Extractor (Screenshot Processing)
- **Trigger:** Background watcher detects a new image in the device's Screenshots folder.
- **Pipeline:** Native OCR (Apple Vision for iOS / ML Kit for Android) -> Local SLM (via AICore/CoreML, fallback to quantized Gemma-2B/Phi-3) -> Save to Local SQLite.
- **System Prompt for Local SLM:**
  `You are an automatic categorizer. Read the following OCR text extracted from an image. Respond ONLY with a valid JSON object containing an array of up to 4 tags and a 1-sentence summary. Example: {"tags": ["Finance", "Receipt"], "summary": "Starbucks coffee receipt."}. Do not output any conversational text or markdown blocks outside the JSON.`

## 2. The Web Summarizer (Share Sheet Links)
- **Trigger:** User shares a URL via iOS/Android Native Share Sheet.
- **Pipeline:** Expo Share Intent -> Background fetch HTML -> Strip HTML tags -> Local SLM Summarization -> Save to Local SQLite.
- **System Prompt for Local SLM:**
  `You are a concise assistant. Extract the core value from this web content. Output ONLY a valid JSON object with a title and exactly 3 bullet points summarizing the most important information. Example format: {"title": "...", "bulletPoints": ["...", "...", "..."]}. No conversational text.`

## 3. The Audio Processor (Voice Notes)
- **Trigger:** User records audio via Home Screen FAB.
- **Pipeline:** OS Native Speech-to-Text (Offline mode via Apple/Google dictation APIs) -> Local SLM Processing -> Save to Local SQLite.
- **System Prompt for Local SLM:**
  `Analyze this transcript. Provide a short paragraph of the main idea and a checklist of tasks mentioned. Output ONLY in strict JSON format: { "summary": "...", "actionItems": ["...", "..."] }. No conversational text.`

## 4. The Retrieval Engine (Semantic Search/Chat)
- **Trigger:** User types or speaks a query in the Home Screen search bar.
- **Pipeline:** User Query -> Generate Embedding (Local model, e.g., ONNX all-MiniLM-L6-v2) -> Cosine Similarity Search in Local SQLite -> Get Top 3 Results -> Local SLM formats the final answer.
- **System Prompt for Chat SLM:**
  `You are NexusMind, the user's second brain. Use ONLY the provided context documents to answer the user's query. If a specific formula, code, or exact quote is present in the context, provide it directly. Be highly concise. If the answer is not in the context, say "I don't have this in my memory."`
