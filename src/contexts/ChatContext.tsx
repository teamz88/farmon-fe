import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { chatApi } from '../services/api';
import { Conversation, Folder } from '../types/chat';

interface ChatContextType {
  conversations: Conversation[];
  folders: Folder[];
  loading: boolean;
  loadConversations: () => Promise<void>;
  loadFolders: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = async () => {
    try {
      const response = await chatApi.getConversations();
      setConversations(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await chatApi.getFolders();
      setFolders(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadConversations(), loadFolders()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const value: ChatContextType = {
    conversations,
    folders,
    loading,
    loadConversations,
    loadFolders,
    refreshData,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};