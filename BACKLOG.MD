# NexusMind - MVP Development Backlog (Definitive Strict Local)

## Phase 1: Project Setup & UI Shell
- [X] Initialize Expo app with TypeScript and Expo Router.
- [X] Configure NativeWind (Tailwind) and set up the strict dark mode / neon purple design system.
- [X] Build **Screen 1 (Home)**: Search bar, 'Paste Link' & 'Record Audio' quick actions, and a placeholder Masonry layout feed (use mock data).
- [X] Build **Screen 2 (Chat/Search)**: Chat interface UI with rich media cards rendering (use mock data).
- [X] Build **Screen 3 (Audio Detail)**: Audio player UI, AI Summary section, and Action Items checklist UI (use mock data).

## Phase 2: Local Database & Architecture
- [X] Set up Expo SQLite.
- [X] Design the schema: `Items` (id, type, raw_content, summary, tags, created_at) and an `Embeddings` table.
- [X] Implement local Vector Search capabilities (SQLite VSS or `pg-lite` with `pgvector`).
- [X] Set up Zustand store to manage UI state and optimistic updates.

## Phase 3: The Capture Engine (Zero-Friction Input)
- [ ] Implement React Native Share Extension (iOS/Android) to receive text and URLs natively.
- [ ] Implement `expo-av` for audio recording on the Home screen.
- [ ] Implement background task to monitor the device's Screenshot directory (handle permissions gracefully).

## Phase 4: Local AI Integration (The Core Differentiator)
- [ ] Integrate local OS-level OCR (Expo ML Kit for Android / Apple Vision for iOS).
- [ ] Integrate local OS-level Speech-to-Text (Offline mode).
- [ ] Set up Local LLM bridging: Implement interfaces for OS-level AI (Apple Intelligence / Android AICore), using `react-native-llama` (quantized models) strictly as a fallback.
- [ ] Write utility functions to strictly parse local SLM JSON outputs into our UI components.

## Phase 5: Semantic Search & Chat
- [ ] Integrate local embedding generation (e.g., ONNX Runtime in React Native using an all-MiniLM model).
- [ ] Implement cosine similarity search over the SQLite vectors.
- [ ] Wire up the Chat UI to the local retrieval logic, rendering the exact Rich Media card designed in Phase 1.

## Phase 6: Polish & Launch
- [ ] Add empty states and loading skeletons (Neon purple subtle pulses).
- [ ] Verify memory (RAM) usage during local SLM inference (prevent Out-Of-Memory crashes).
- [ ] Verify battery consumption on background tasks.
- [ ] E2E Testing of the 3 main user journeys.
