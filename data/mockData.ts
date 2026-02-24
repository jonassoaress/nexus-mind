// NexusMind Mock Data for Phase 1 UI Shell

export interface CaptureItem {
  id: string;
  type: "screenshot" | "link" | "audio" | "note";
  title: string;
  summary?: string;
  tags: string[];
  imageUrl?: string;
  author?: string;
  source?: string;
  timestamp: string;
  duration?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mediaCard?: {
    title: string;
    bulletPoints: string[];
    videoThumbnail?: string;
    videoDuration?: string;
    copyAction?: string;
  };
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface AudioDetail {
  id: string;
  title: string;
  date: string;
  tags: string[];
  autoTags: string[];
  duration: string;
  currentTime: string;
  remainingTime: string;
  status: "AI PROCESSED" | "PROCESSING" | "PENDING";
  summary: string;
  summaryTags: string[];
  actionItems: ActionItem[];
}

// Home Screen - Recent Captures
export const MOCK_CAPTURES: CaptureItem[] = [
  {
    id: "1",
    type: "screenshot",
    title: "Starbucks Receipt",
    tags: ["FINANCE"],
    imageUrl: "receipt",
    timestamp: "2 min ago",
  },
  {
    id: "2",
    type: "link",
    title: "Atomic Habits",
    tags: ["TO READ"],
    author: "James Clear",
    imageUrl: "book",
    timestamp: "15 min ago",
  },
  {
    id: "3",
    type: "link",
    title: "VLOOKUP Masterclass",
    tags: ["EXCEL TUTORIAL"],
    source: "TikTok \u2022 @excelwiz",
    imageUrl: "video",
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    type: "note",
    title: "Need to research more about the intersection of AI and biology for...",
    tags: ["IDEA"],
    timestamp: "Just now",
  },
];

// Search/Chat Screen - Conversation
export const MOCK_CHAT: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Find that TikTok video about Excel macros",
    timestamp: "TODAY 10:23 AM",
  },
  {
    id: "2",
    role: "assistant",
    content: "",
    timestamp: "",
    mediaCard: {
      title: "Excel Macros in 60s",
      bulletPoints: [
        "Automate repetitive tasks instantly",
        "Record macro via Developer tab",
      ],
      videoThumbnail: "excel_video",
      videoDuration: "0:59",
      copyAction: "Copy Formula",
    },
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Here is the formula extracted from the video. Would you like me to explain how to apply it?",
    timestamp: "NexusMind \u2022 Just now",
  },
];

// Audio Detail Screen
export const MOCK_AUDIO_DETAIL: AudioDetail = {
  id: "audio-1",
  title: "Brainstorming Session",
  date: "Voice Note - Oct 24",
  tags: ["Business", "Strategy"],
  autoTags: ["Business", "Strategy"],
  duration: "2:23",
  currentTime: "0:34",
  remainingTime: "-1:49",
  status: "AI PROCESSED",
  summary:
    "Brainstorming a new B2B SaaS idea for automated customer onboarding. The discussion focuses primarily on strategies for reducing churn during the critical first 14 days of user engagement.",
  summaryTags: ["#SaaS", "#Retention", "#ProductStrategy"],
  actionItems: [
    { id: "a1", text: "Draft initial user flow diagram", completed: false },
    { id: "a2", text: "Research competitor onboarding flows", completed: false },
    { id: "a3", text: "Schedule meeting with design team", completed: false },
  ],
};
