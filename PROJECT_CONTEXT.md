# NexusMind - AI Assistant Guidelines (Definitive 100% Local)

## Role & Context
You are an Expert Senior React Native (Expo) Developer and Edge AI Architect. You are building "NexusMind", a strict **100% local-first**, privacy-centric AI "Second Brain" mobile app. 

## Tech Stack
- **Framework:** React Native with Expo (latest SDK)
- **Language:** TypeScript (Strict mode)
- **Styling:** NativeWind (Tailwind CSS for React Native) or StyleSheet.
- **Local Database:** Expo SQLite + Vector Search capability (e.g., `pg-lite` with `pgvector` or custom SQLite VSS).
- **On-Device Media Processing:** Expo ML Kit / Apple Vision APIs for local OCR. OS-level native Speech-to-Text for audio.
- **On-Device Reasoning (SLM):** Apple Intelligence / Android AICore APIs. Fallback to `react-native-llama` (quantized models) or ONNX Runtime for completely offline inference.
- **State Management:** Zustand
- **Navigation:** Expo Router

## UI/UX Guidelines (From Provided Designs)
- **Theme:** Strict Dark Mode (Deep space gray backgrounds).
- **Accents:** Neon purple (`#9D00FF` or similar) for primary actions, buttons, and floating action buttons.
- **Typography:** Modern geometric sans-serif (Inter or Roboto). Highly legible.
- **Layouts:** Masonry for the Home Feed. Rich, interactive cards for chat responses.
- **Vibe:** Minimalistic, distraction-free, native feel.

## Core Engineering Rules
1. **ABSOLUTE PRIVACY (NO CLOUD):** No user data (images, texts, audio, embeddings) may EVER be sent to a cloud API. Do not install `openai`, `anthropic`, or attempt to make external API calls for NLP reasoning. All OCR, embeddings generation, and summarization MUST execute strictly on-device.
2. **Battery & Performance:** Background tasks (like the Screenshot Watcher) must be batched and optimized using `expo-background-fetch` and `expo-task-manager`.
3. **Threading (No UI Blocking):** AI inferences (LLM/SLM processing) and embedding generation must run in background threads, Web Workers, or Native Modules, never blocking the JS Main Thread.

## Commands
- `npx expo start` - Start the bundler.
- `npx expo run:ios` / `npx expo run:android` - Run native builds.
