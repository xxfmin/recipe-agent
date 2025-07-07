"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ImagePlus, Send, X } from "lucide-react";
import { useRef, useState } from "react";

export default function ChatPage() {
  //   const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {};

  const removeImage = () => {};

  const handleSubmit = async (e: React.FormEvent) => {};

  return (
    <div className="container mx-auto max-4-xl h-screen flex flex-col">
      {/* header */}
      <div className="flex-none border-b bg-background px-6 py-4">
        <h2 className="text-lg font-semibold">Recipe Agent</h2>
      </div>

      {/* chat */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4"></div>

      {/* input */}
      <form onSubmit={handleSubmit} className="space-y-2 pb-16 md:pb-8">
        {/* image preview */}
        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Selected"
              className="h-20 rounded-lg border"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
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
            placeholder="Ask Sous"
            disabled={isStreaming}
            className="flex-1 py-5"
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
  );
}
