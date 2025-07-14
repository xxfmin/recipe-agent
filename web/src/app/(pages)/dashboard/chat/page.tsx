"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ImagePlus, Send, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { ChatMessage, StreamData } from "@/types/chat";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      // create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() && !selectedImage) return;

    // create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      message: inputMessage,
      imagePreview: imagePreview,
    };

    setMessages((prev) => [...prev, userMessage]);

    // create assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      isLoading: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // clear inputs
    setInputMessage("");
    setSelectedImage(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsStreaming(true);

    try {
      // prepare request body
      const body: any = {};

      if (inputMessage.trim()) {
        body.message = inputMessage.trim();
      }

      if (selectedImage) {
        const base64 = await fileToBase64(selectedImage);
        body.image_base64 = base64;
      }

      // send request to agent
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      // process streaming response
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            // update assistant message with streaming data
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];

              if (lastMessage && lastMessage.role === "assistant") {
                lastMessage.streamingData = data;
                lastMessage.isLoading = false;
              }

              return newMessages;
            });
          } catch (err) {
            console.error("Error parsing JSON:", err, "Line:", line);
          }
        }
      }

      // process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];

            if (lastMessage && lastMessage.role === "assistant") {
              lastMessage.streamingData = data;
              lastMessage.isLoading = false;
            }

            return newMessages;
          });
        } catch (err) {
          console.error("Error parsing final buffer:", err, "Buffer:", buffer);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // update assistant message with error
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];

        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.streamingData = {
            type: "error",
            message:
              "Failed to connect to the recipe assistant. Please try again.",
          };
          lastMessage.isLoading = false;
        }

        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* header - matching My Recipes page style */}
      <div className="flex-none border-b bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 mx-auto w-full max-w-screen-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recipe Agent</h1>
              <p className="text-sm text-gray-600">
                Chat with your AI cooking assistant
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* chat container */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        {/* chat messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Welcome to Recipe Assistant!
              </h3>
              <p className="text-gray-600 max-w-md">
                Upload a photo of your fridge to discover recipes you can make
                with your ingredients, or ask me to find any recipe you're
                craving.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                role={msg.role}
                message={msg.message}
                imagePreview={msg.imagePreview}
                streamingData={msg.streamingData}
                isLoading={msg.isLoading}
              />
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* input form */}
        <form
          onSubmit={handleSubmit}
          className="flex-none border-t bg-white p-6 space-y-2"
        >
          {/* image preview */}
          {imagePreview && (
            <div className="relative inline-block mb-2">
              <img
                src={imagePreview}
                alt="Selected"
                className="h-20 rounded-lg border"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* input row */}
          <div className="flex gap-2">
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about recipes or upload a fridge photo..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isStreaming || (!inputMessage.trim() && !selectedImage)}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
