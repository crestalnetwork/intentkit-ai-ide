// Agent types
export interface Agent {
  id: string;
  name?: string;
  model?: string;
  purpose?: string;
  personality?: string;
  created_at?: string;
  updated_at?: string;
  skills?: Record<string, Skill>;
  [key: string]: any; // For any additional properties
}

export interface Skill {
  enabled: boolean;
  api_key?: string;
  api_key_provider?: string;
  states?: Record<string, string>;
  [key: string]: any; // For any additional properties
}

// Agent Generation API types
export interface AgentGenerateRequest {
  prompt: string;
  existing_agent?: any;
  user_id?: string;
  project_id?: string;
}

export interface AgentGenerateResponse {
  agent: Record<string, any>;
  project_id: string;
  summary: string;
  tags: Array<{ id: number }>;
}

export interface ConversationMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface ConversationProject {
  project_id: string;
  user_id?: string;
  created_at?: string;
  last_activity?: string;
  message_count: number;
  last_message?: ConversationMessage;
  first_message?: ConversationMessage;
  conversation_history: ConversationMessage[];
}

export interface GenerationsListResponse {
  projects: ConversationProject[];
}

export interface GenerationDetailResponse {
  project_id: string;
  user_id?: string;
  created_at?: string;
  last_activity?: string;
  message_count: number;
  last_message?: ConversationMessage;
  first_message?: ConversationMessage;
  conversation_history: ConversationMessage[];
}

// Component props
export interface AgentsListProps {
  baseUrl: string;
  onAgentSelect: (agent: Agent) => void;
  selectedAgentId?: string;
}

export interface AgentDetailProps {
  agent: Agent | null;
}

export interface ChatInterfaceProps {
  baseUrl: string;
  agentName: string;
}

export interface SettingsProps {
  baseUrl: string;
  onBaseUrlChange: (url: string) => void;
}

export interface AgentCreatorProps {
  baseUrl: string;
  onAgentCreated?: (agent: Record<string, any>) => void;
  projectId?: string | null;
}

// Message types for chat
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isJson?: boolean;
  isError?: boolean;
  rawData?: any;
}

// Status types for feedback messages
export interface StatusMessage {
  type: 'success' | 'error';
  message: string;
} 