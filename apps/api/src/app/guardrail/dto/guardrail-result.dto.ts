export interface GuardrailResult {
  blocked: boolean;
  reason?: string;
  sanitized?: string;
  userMessage?: string;
}

export interface ViolationRecord {
  userId: string;
  agentId?: string;
  type: "prompt_injection" | "content_policy" | "pii_leak" | "dangerous_output";
  severity: "low" | "medium" | "high" | "critical";
  input?: string;
  output?: string;
  metadata?: Record<string, unknown>;
}
