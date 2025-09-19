import React, { useState, useEffect } from 'react';
import { X, MessageCircle, User, Bot, Calendar, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { chatApi } from '../services/api';
import { ChatMessage, Conversation } from '../types/chat';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    email: string;
    full_name: string;
  } | null;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ isOpen, onClose, user }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadUserConversations();
    }
  }, [isOpen, user]);

  const loadUserConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Note: This assumes there's an API endpoint to get conversations by user
      // You may need to modify the API to support filtering by user ID
      const response = await chatApi.getConversations();
      setConversations(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load user conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const response = await chatApi.getConversationHistory(conversationId);
      setMessages(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
    loadConversationMessages(conversationId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sanitizeHtml = (html: string): string => {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const formatMessageContent = (message: ChatMessage) => {
    if (message.message_type === 'assistant') {
      return (
        <div className="text-primary-900 text-base leading-relaxed markdown-content">
          {message.isHtml ? (
            <div 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.content) }}
              className="prose prose-sm max-w-none prose-headings:text-primary-900 prose-p:text-primary-800 prose-strong:text-primary-900 prose-code:text-primary-600 prose-code:bg-primary-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-primary-100 prose-pre:border prose-blockquote:border-l-4 prose-blockquote:border-primary-300 prose-blockquote:pl-4 prose-blockquote:italic"
            />
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:text-primary-900 prose-p:text-primary-800 prose-strong:text-primary-900 prose-strong:font-bold prose-code:text-primary-600 prose-code:bg-primary-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-primary-100 prose-pre:border prose-blockquote:border-l-4 prose-blockquote:border-primary-300 prose-blockquote:pl-4 prose-blockquote:italic">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      );
    } else {
      return <p className="text-base leading-relaxed">{message.content}</p>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-primary-900">Chat History</h2>
              {user && (
                <p className="text-sm text-primary-600">
                  {user.full_name} ({user.email})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-primary-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-primary-200 bg-primary-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-primary-700 mb-3">Conversations</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-primary-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 text-primary-300" />
                  <p>No conversations found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-primary-200 border-primary-300'
                          : 'bg-white hover:bg-primary-100'
                      } border border-primary-200`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-primary-900 truncate">
                            {conversation.title}
                          </h4>
                          <div className="flex items-center mt-1 text-xs text-primary-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(conversation.created_at)}
                          </div>
                          <div className="flex items-center mt-1 text-xs text-primary-600">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {conversation.message_count} messages
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-primary-200 bg-primary-50">
                  <h3 className="text-sm font-medium text-primary-700">Messages</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-primary-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-primary-300" />
                      <p>No messages found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex w-full ${
                            message.message_type === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div className={`flex items-start gap-3 w-full ${
                            message.message_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}>
                            {message.message_type === 'assistant' && (
                              <div className="w-10 h-10 rounded-full flex items-center overflow-hidden justify-center text-white text-base font-medium flex-shrink-0 shadow-md">
                                <img src="/farmon_fav.png" alt="Farmon" className="w-8 h-8" />
                              </div>
                            )}
                            <div
                              className={`rounded-xl px-5 py-4 shadow-sm ${
                                message.message_type === 'user'
                                  ? 'bg-primary-400 text-white max-w-2xl'
                                  : 'bg-primary-100 text-primary-900 max-w-3xl'
                              }`}
                            >
                              {formatMessageContent(message)}
                              
                              {/* Sources section for assistant messages */}
                              {message.message_type === 'assistant' && message.sources && message.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-primary-200">
                                  <p className="text-sm font-medium text-primary-700 mb-2">Sources:</p>
                                  <div className="space-y-1">
                                    {message.sources.map((source, index) => {
                                      // Handle both string sources (legacy) and object sources (new format)
                                      let sourceUrl: string;
                                      let displayText: string;
                                      let pageNumber: number | undefined;
                                      
                                      if (typeof source === 'string') {
                                        // Legacy string format
                                        sourceUrl = source;
                                        const isUrl = source.startsWith('http://') || source.startsWith('https://');
                                        displayText = isUrl ? new URL(source).hostname : (source.split('.')[0] ?? source);
                                        pageNumber = undefined;
                                      } else {
                                        // New object format with filename and page
                                        sourceUrl = source.filename;
                                        const isUrl = source.filename.startsWith('http://') || source.filename.startsWith('https://');
                                        displayText = isUrl ? new URL(source.filename).hostname : (source.filename.split('.')[0] ?? source.filename);
                                        pageNumber = source.page;
                                      }
                                      
                                      return (
                                        <div key={index} className="flex items-center justify-between bg-primary-50 rounded-md px-3 py-2">
                                          <div className="flex items-center gap-2 flex-1 truncate">
                                            <span className="text-sm text-primary-600 truncate">{displayText}</span>
                                            {pageNumber && (
                                              <span className="text-xs bg-primary-200 text-primary-700 px-2 py-1 rounded-full font-medium">
                                                Page {pageNumber}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-primary-500">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-primary-300" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryModal;