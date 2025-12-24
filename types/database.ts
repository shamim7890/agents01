// Database Types
export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  model_id: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number;
  processing_time: number;
  created_at: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  model_id: string;
  category: string;
  is_public: boolean;
  avatar_color: string;
  created_at: string;
}

// Extended types with relations
export interface ConversationWithAgent extends Conversation {
  agent: Agent;
  message_count?: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  agent: Agent;
}

export interface AgentWithStats extends Agent {
  conversation_count: number;
  total_messages: number;
  last_used?: string;
}

// API Request/Response Types
export interface CreateAgentRequest {
  name: string;
  description?: string;
  system_prompt: string;
  model_id: string;
  temperature?: number;
  max_tokens?: number;
  avatar_color?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  system_prompt?: string;
  model_id?: string;
  temperature?: number;
  max_tokens?: number;
  is_active?: boolean;
  avatar_color?: string;
}

export interface CreateConversationRequest {
  agent_id: string;
  title?: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  message: string;
}

export interface ChatResponse {
  message: Message;
  conversation: Conversation;
  tokens_used: number;
  processing_time: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Model Options
export interface ModelOption {
  id: string;
  name: string;
  description: string;
  category: string;
  maxTokens: number;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'meta-llama/Llama-3.2-3B-Instruct',
    name: 'Llama 3.2 3B Instruct',
    description: 'Fast and efficient chat model',
    category: 'General Purpose',
    maxTokens: 2048
  },
  {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B Instruct',
    description: 'More capable, balanced performance',
    category: 'General Purpose',
    maxTokens: 4096
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct',
    name: 'Llama 3.3 70B Instruct',
    description: 'Most capable Llama model',
    category: 'General Purpose',
    maxTokens: 4096
  },
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen 2.5 7B Instruct',
    description: 'Multilingual support, strong reasoning',
    category: 'General Purpose',
    maxTokens: 4096
  },
  {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder 32B',
    description: 'Specialized for coding tasks',
    category: 'Coding',
    maxTokens: 4096
  },
  {
    id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    name: 'DeepSeek R1 Distill 8B',
    description: 'Strong reasoning and structured outputs',
    category: 'Reasoning',
    maxTokens: 4096
  },
  {
    id: 'deepseek-ai/DeepSeek-V3',
    name: 'DeepSeek V3',
    description: 'Advanced reasoning model',
    category: 'Reasoning',
    maxTokens: 4096
  },
  {
    id: 'NousResearch/Hermes-3-Llama-3.1-8B',
    name: 'Hermes 3 Llama 8B',
    description: 'Function calling and tool use',
    category: 'Advanced',
    maxTokens: 4096
  },
  {
    id: 'NousResearch/Hermes-4-70B',
    name: 'Hermes 4 70B',
    description: 'Most capable Hermes model',
    category: 'Advanced',
    maxTokens: 4096
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    description: 'Large open source model',
    category: 'Advanced',
    maxTokens: 4096
  },
  {
    id: 'moonshotai/Kimi-K2-Instruct-0905',
    name: 'Kimi K2 Instruct',
    description: 'High performance instruction model',
    category: 'Advanced',
    maxTokens: 4096
  }
];

// Validation helpers
export function isValidTemperature(temp: number): boolean {
  return temp >= 0 && temp <= 2;
}

export function isValidMaxTokens(tokens: number): boolean {
  return tokens > 0 && tokens <= 4096;
}

export function isValidModelId(modelId: string): boolean {
  return AVAILABLE_MODELS.some(m => m.id === modelId);
}