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