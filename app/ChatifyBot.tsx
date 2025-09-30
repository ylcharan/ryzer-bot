// app/components/ChatbotifyClient.tsx
"use client";

import React from "react";

export default function ChatbotifyClient() {
  const [question, setQuestion] = React.useState("");
  const [messages, setMessages] = React.useState<
    { text: string; sender: "user" | "bot" }[]
  >([{ text: "Hello! How can I assist you today?", sender: "bot" }]);

  const [isLoading, setIsLoading] = React.useState(false);
  const askQuestion = async (question: string) => {
    const questionPayload = { question };
    setIsLoading(true);
    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionPayload),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { text: data.answer, sender: "bot" }]);
    setIsLoading(false);
    return data.answer;
  };

  return (
    <div className="flex w-[90%] mx-auto my-[50px] flex-col gap-2 border p-4 ">
      <div className="h-[80vh] overflow-hidden scroll-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${
              msg.sender === "user"
                ? "text-right"
                : "text-left bg-gray-100 text-black p-2 rounded-lg"
            } mb-2`}
          >
            <span className="text-sm font-bold mr-2">
              {msg.sender === "user" ? "You" : "Bot"}:
            </span>
            {msg.text}
          </div>
        ))}
      </div>
      {isLoading && <div className="message bot">Loading...</div>}
      <div className="flex items-center gap-2 mt-auto">
        <input
          type="text"
          placeholder="Type your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="border p-2 rounded-sm w-full"
        />
        <button
          onClick={() => {
            askQuestion(question);
            setQuestion("");
          }}
          disabled={isLoading || question.trim() === ""}
          className={`bg-blue-500 text-white p-2 rounded-sm px-[20px] ${
            isLoading || question.trim() === ""
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-600"
          }`}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
