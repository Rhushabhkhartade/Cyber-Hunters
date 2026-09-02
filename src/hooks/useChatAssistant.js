import { useCallback, useState } from "react";
import { getAssistantReply } from "../api/mockApi";

const initialMessages = [
  {
    sender: "ai",
    text: "System connection secure. I am Sentinel, your synthetic security advisor. Ask me anything about voice clones, video deepfakes, or social engineering indicators."
  }
];

export function useChatAssistant() {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [isChatting, setIsChatting] = useState(false);

  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: message }]);
    setChatInput("");
    setIsChatting(true);

    const reply = await getAssistantReply(message);

    setChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    setIsChatting(false);
  }, []);

  return {
    chatInput,
    setChatInput,
    chatMessages,
    setChatMessages,
    isChatting,
    sendMessage
  };
}
