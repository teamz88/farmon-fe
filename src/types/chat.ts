export interface Folder {
  id: string;
  name: string;
  description?: string;
  color: string;
  conversation_count: number;
  created_at: string;
  updated_at: string;
  user: number;
}

export interface Conversation {
  id: string;
  title: string;
  folder?: string | null;
  folder_name?: string | null;
  folder_color?: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_pinned: boolean;
  message_count: number;
  user: number;
}

export interface ChatMessage {
  id: string;
  conversation: string;
  content: string;
  message_type: 'user' | 'assistant';
  sources?: string[];
  created_at: string;
  updated_at: string;
  feedback?: 'positive' | 'negative' | null;
  metadata?: Record<string, any>;
  isHtml?: boolean;
}

export interface MessageFeedback {
  id: string;
  message: string;
  feedback_type: 'positive' | 'negative';
  comment?: string;
  created_at: string;
}

export interface ChatTemplate {
  id: number;
  name: string;
  description: string;
  prompt_template: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatStats {
  total_conversations: number;
  total_messages: number;
  messages_today: number;
  messages_this_week: number;
  messages_this_month: number;
  average_conversation_length: number;
  most_active_users: Array<{
    user_id: number;
    username: string;
    message_count: number;
  }>;
}

export interface SendMessageRequest {
  conversation_id: string;
  message: string;
  message_type?: 'user' | 'assistant';
  template_id?: number;
}

export interface CreateConversationRequest {
  title: string;
  initial_message?: string;
  folder?: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface MoveFolderRequest {
  folder_id?: string | null;
}

export interface FolderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Folder[];
}

export interface ConversationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Conversation[];
}

export interface MessageListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}