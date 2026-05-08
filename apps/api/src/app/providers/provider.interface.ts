export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  providerId: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: ChatChoice[];
  usage: ChatUsage;
}

export interface ProviderAdapter {
  chat(params: ChatRequest): Promise<ChatResponse>;
  chatStream?(params: ChatRequest): AsyncGenerator<string, void, unknown>;
}
