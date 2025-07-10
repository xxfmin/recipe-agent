interface StreamData {
  type: "step" | "complete" | "error";
  step?: string;
  status?: string;
  message?: string;
  recipes?: Recipe[];
  data?: {
    ingredients_count?: number;
    ingredients?: string[];
    [key: string]: any;
  };
  summary?: {
    total_ingredients_found?: number;
    ingredients_used_for_search?: string;
    total_recipes?: number;
    query?: string;
  };
}

interface ChatBubbleProps {
  role: "user" | "assistant";
  message?: string;
  imagePreview?: string;
  streamingData?: StreamData;
  isLoading?: boolean;
}

interface ChatMessage extends ChatBubbleProps {
  id: string;
}
