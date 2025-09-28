// app/components/ChatbotifyClient.tsx
"use client";

import dynamic from "next/dynamic";

const ChatBot = dynamic(
  () => import("react-chatbotify").then((m) => m.default),
  {
    ssr: false,
  }
);

export default function ChatbotifyClient() {
  const askQuestion = async (question: string) => {
    const questionPayload = { question };

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionPayload),
    });

    const data = await res.json();
    return data.answer;
  };

  const flow = {
    start: {
      message: "Hey, How can I help you are you?",
      path: "end",
    },

    end: {
      message: async (param: { userInput: string }) => {
        return await askQuestion(param.userInput!);
      },
      path: "start",
    },
  };

  const settings = {
    general: {
      embedded: true,
    },
    chatHistory: {
      storageKey: "conversations_summary",
    },
  };
  const themes = [
    { id: "minimal_midnight", version: "0.1.0" },
    { id: "simple_blue", version: "0.1.0" },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "100px",
      }}
    >
      <ChatBot themes={themes} settings={settings} flow={flow} />;
    </div>
  );
}
