import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import {
  Send as SendIcon,
  Plus as AddIcon,
  Archive as ArchiveIcon,
  Trash2 as DeleteIcon,
  Download as DownloadIcon,
  Pin as PinIcon,
  X as CloseIcon,
  Menu as MenuIcon,
  Send,
  Edit,
  Copy,
  Share,
  Check,
  RotateCcw,
  X,
  ThumbsUp,
  ThumbsDown,
  User2Icon,
  Folder as FolderIcon,
  FolderPlus as FolderPlusIcon,
  MoreVertical as MoreVerticalIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  Mail as MailIcon,
  EyeIcon,
  Link2Icon,
  LinkIcon,
  Paperclip as PaperclipIcon,
} from 'lucide-react';
import { chatApi, filesApi } from '../services/api';
import { Conversation, ChatMessage, ConversationListResponse, MessageListResponse, Folder } from '../types/chat';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../hooks/useAuth';

// Typing indicator component
const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3 w-full max-w-4xl">
        <div className="w-10 h-10 rounded-full bg-primary-400 overflow-hidden flex items-center justify-center text-white text-base font-medium flex-shrink-0 shadow-md">
          <img src="/farmon_fav.png" alt="farmon" className="w-8 h-8" />
        </div>
        <div className="rounded-xl px-5 py-4 shadow-sm bg-primary-100 text-primary-900 max-w-3xl">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm text-primary-700 ml-2">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple HTML sanitizer function
const sanitizeHtml = (html: string): string => {
  // Remove potentially dangerous tags and attributes
  const dangerousTags = /<(script|iframe|object|embed|form|input|textarea|select|button|link|meta|style)[^>]*>.*?<\/\1>|<(script|iframe|object|embed|form|input|textarea|select|button|link|meta|style)[^>]*\/?>/gi;
  const dangerousAttributes = /(on\w+|javascript:|data:|vbscript:|expression\()/gi;
  
  let sanitized = html.replace(dangerousTags, '');
  sanitized = sanitized.replace(dangerousAttributes, '');
  
  return sanitized;
};

const Chat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newChatFolderId, setNewChatFolderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [currentFeedbackMessage, setCurrentFeedbackMessage] = useState<ChatMessage | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadSuccess, setFileUploadSuccess] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { conversations, loadConversations, loading: contextLoading } = useChatContext();
  const { user } = useAuth();

  // Remove the useEffect that loads data since ChatContext handles it

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  // Only scroll to bottom when streaming new messages, not when loading existing messages
  useEffect(() => {
    // Only auto-scroll if we're currently typing/streaming or if this is a new message being added
    if (isTyping || loading) {
      scrollToBottom();
    }
  }, [messages, isTyping, loading]);

  // Listen for folder selection events and new chat events
  useEffect(() => {
    const handleSetSelectedFolder = (event: CustomEvent) => {
      setNewChatFolderId(event.detail.folderId);
    };

    const handleClearConversation = () => {
      setSelectedConversation(null);
      setMessages([]);
    };

    const handleNewChat = () => {
      setSelectedConversation(null);
      setMessages([]);
      setNewChatFolderId(null);
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('conversation');
      url.searchParams.delete('folder');
      window.history.replaceState({}, '', url.pathname);
    };

    const handleNewChatInFolder = (event: CustomEvent) => {
      setSelectedConversation(null);
      setMessages([]);
      setNewChatFolderId(event.detail.folderId);
      // Clear URL parameters but keep folder
      const url = new URL(window.location.href);
      url.searchParams.delete('conversation');
      url.searchParams.set('folder', event.detail.folderId);
      window.history.replaceState({}, '', url.toString());
    };

    window.addEventListener('setSelectedFolder', handleSetSelectedFolder as EventListener);
    window.addEventListener('clearConversation', handleClearConversation);
    window.addEventListener('newChat', handleNewChat as EventListener);
    window.addEventListener('newChatInFolder', handleNewChatInFolder as EventListener);

    return () => {
      window.removeEventListener('setSelectedFolder', handleSetSelectedFolder as EventListener);
      window.removeEventListener('clearConversation', handleClearConversation);
      window.removeEventListener('newChat', handleNewChat as EventListener);
      window.removeEventListener('newChatInFolder', handleNewChatInFolder as EventListener);
    };
  }, []);

  // Handle URL parameters for conversation and folder selection
  useEffect(() => {
    // Prioritize conversationId from URL path over search params
    const urlConversationId = conversationId || searchParams.get('conversation');
    const folderId = searchParams.get('folder');
    
    if (urlConversationId && urlConversationId !== selectedConversation) {
      setSelectedConversation(urlConversationId);
    }
    
    if (folderId && folderId !== newChatFolderId) {
      setNewChatFolderId(folderId);
    }
  }, [conversationId, searchParams, selectedConversation, newChatFolderId]);

  // Listen for conversation selection events from Layout
  useEffect(() => {
    const handleConversationSelected = (event: CustomEvent) => {
      const { conversationId } = event.detail;
      if (conversationId && conversationId !== selectedConversation) {
        setSelectedConversation(conversationId);
      }
    };

    const handleClearConversation = () => {
      setSelectedConversation(null);
      setMessages([]);
      // Clear URL parameters to prevent re-selection
      const url = new URL(window.location.href);
      url.searchParams.delete('conversation');
      window.history.replaceState({}, '', url.pathname);
    };

    window.addEventListener('conversationSelected', handleConversationSelected as EventListener);
    window.addEventListener('clearConversation', handleClearConversation as EventListener);
    return () => {
      window.removeEventListener('conversationSelected', handleConversationSelected as EventListener);
      window.removeEventListener('clearConversation', handleClearConversation as EventListener);
    };
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Removed auto-select first conversation to always show greeting screen when no conversation is specified

  // Helper function to generate conversation title from first message
  const generateConversationTitle = (message: string): string => {
    // Take first 50 characters and add ellipsis if longer
    const title = message.trim().substring(0, 50);
    return title.length < message.trim().length ? title + '...' : title;
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await chatApi.getConversationHistory(conversationId);
      setMessages(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const streamResponse = async (messageText: string, conversationId: string) => {
    try {
      // Get auth token
      const token = localStorage.getItem('authToken');
      const baseURL = (import.meta as any).env.VITE_API_BASE_URL || 'https://backendfarmon.omadligrouphq.com/api';
      
      // Prepare request body with user_info if user is available
      const requestBody: any = {
        message: messageText,
        conversation_id: conversationId
      };
      
      // Add user_info if user is authenticated
      if (user) {
        requestBody.user_info = {
          email: user.email
        };
      }
      
      const response = await fetch(`${baseURL}/chat/stream/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - redirect to login or refresh token
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      const decoder = new TextDecoder();
      
      // Add empty assistant message to UI
      const tempAssistantMessage: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        content: '',
        message_type: 'assistant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation: conversationId
      };
      setMessages(prev => [...prev, tempAssistantMessage]);
      setIsTyping(false);
      
      let accumulatedContent = '';
      let accumulatedSources: string[] = [];
      let actualUserMessageId: string | null = null;
      let actualAssistantMessageId: string | null = null;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Capture actual message IDs from backend
                if (data.user_message_id && !actualUserMessageId) {
                  actualUserMessageId = data.user_message_id;
                }
                if (data.assistant_message_id && !actualAssistantMessageId) {
                  actualAssistantMessageId = data.assistant_message_id;
                }
                
                if (data.type === 'delta') {
                  // Handle streaming content chunks
                  accumulatedContent += data.content;
                  
                  // Store both HTML and processed content for styling
                  let processedContent = accumulatedContent;
                  let isHtmlContent = false;
                  
                  // Check if content contains HTML tags
                  if (processedContent.includes('<') && processedContent.includes('>')) {
                    isHtmlContent = true;
                    // Keep HTML content for styled rendering
                  }
                  
                  // Update the assistant message content in real-time with immediate rendering
                  setMessages(prev => {
                    const updatedMessages = prev.map(msg => {
                      if (msg.id === tempAssistantMessage.id) {
                        return {
                          ...msg,
                          id: actualAssistantMessageId || msg.id, // Update with real ID if available
                          content: processedContent, 
                          isHtml: isHtmlContent,
                          updated_at: new Date().toISOString() 
                        };
                      }
                      // Also update user message ID if it's a temp message
                       if (msg.id.startsWith('temp-user-') && msg.message_type === 'user' && actualUserMessageId) {
                         return {
                           ...msg,
                           id: actualUserMessageId
                         };
                       }
                      return msg;
                    });
                    return updatedMessages;
                  });
                  
                  // Update temp message reference
                  if (actualAssistantMessageId) {
                    tempAssistantMessage.id = actualAssistantMessageId;
                  }
                  
                  // Force immediate DOM update and scroll
                  requestAnimationFrame(() => {
                    scrollToBottom();
                  });
                } else if (data.type === 'complete') {
                  // Final update with completion timestamp
                  if (data.response) {
                    accumulatedContent = data.response; // Use the final formatted response
                  }
                  
                  // Determine if final content is HTML
                  let finalContent = accumulatedContent;
                  let isHtmlContent = false;
                  
                  if (finalContent.includes('<') && finalContent.includes('>')) {
                    isHtmlContent = true;
                  }
                  
                  
                  setMessages(prev => prev.map(msg => {
                    if (msg.id === tempAssistantMessage.id || msg.id === actualAssistantMessageId) {
                      return {
                        ...msg,
                        id: actualAssistantMessageId || msg.id,
                        content: finalContent, 
                        isHtml: isHtmlContent,
                        sources: accumulatedSources.length > 0 ? accumulatedSources : undefined,
                        updated_at: new Date().toISOString() 
                      };
                    }
                    // Also update user message ID if it's a temp message
                     if (msg.id.startsWith('temp-user-') && msg.message_type === 'user' && actualUserMessageId) {
                       return {
                         ...msg,
                         id: actualUserMessageId
                       };
                     }
                    return msg;
                  }));
                  
                  // Call both conversations and history APIs after stream completes
                  try {
                    await Promise.all([
                      loadConversations(), // Refresh conversations list
                      loadMessages(conversationId) // Refresh conversation history
                    ]);
                  } catch (apiError) {
                    console.error('Failed to refresh data after stream:', apiError);
                  }
                  
                  return;
                } else if (data.type === 'source_document') {
                  // Handle source documents and add to sources array
                  
                  // Handle both single source string and array of sources
                  let sourcesToAdd: string[] = [];
                  
                  if (Array.isArray(data.source)) {
                    // New format: source is an array
                    sourcesToAdd = data.source.filter((source: string) => 
                      source && !accumulatedSources.includes(source)
                    );
                  } else if (data.source && typeof data.source === 'string') {
                    // Old format: source is a single string
                    if (!accumulatedSources.includes(data.source)) {
                      sourcesToAdd = [data.source];
                    }
                  }
                  
                  if (sourcesToAdd.length > 0) {
                    accumulatedSources.push(...sourcesToAdd);
                    
                    // Update the assistant message with sources
                    setMessages(prev => {
                      const updatedMessages = prev.map(msg => {
                        if (msg.id === tempAssistantMessage.id || msg.id === actualAssistantMessageId) {
                          return {
                            ...msg,
                            id: actualAssistantMessageId || msg.id,
                            sources: [...accumulatedSources],
                            updated_at: new Date().toISOString()
                          };
                        }
                        // Also update user message ID if it's a temp message
                         if (msg.id.startsWith('temp-user-') && msg.message_type === 'user' && actualUserMessageId) {
                           return {
                             ...msg,
                             id: actualUserMessageId
                           };
                         }
                        return msg;
                      });
                      return updatedMessages;
                    });
                  }
                } else if (data.type === 'error') {
                  throw new Error(data.error || data.response);
                } else {
                  // Handle unknown event types gracefully
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // Remove temp assistant message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-assistant-')));
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);
    setIsTyping(true);
    
    try {
      // Upload file first if one is selected
      if (selectedFile) {
        setUploadingFile(true);
        try {
          await uploadFileToBackend(selectedFile);
          setSelectedFile(null);
        } catch (error: any) {
          setUploadingFile(false);
          const errorMessage = error.message || 'An error occurred while uploading the file. Please try again.';
          alert(errorMessage);
          return; // Don't proceed with sending message if file upload fails
        }
        setUploadingFile(false);
      }
      
      if (!selectedConversation) {
        // No conversation selected, create new one and send first message
        await sendFirstMessage(messageText);
      } else {
        // Existing conversation, add user message to UI immediately
        const tempUserMessage: ChatMessage = {
          id: `temp-user-${Date.now()}`,
          content: messageText,
          message_type: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          conversation: selectedConversation
        };
        setMessages(prev => [...prev, tempUserMessage]);
        
        // Stream the response
        await streamResponse(messageText, selectedConversation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error if it was added
      if (selectedConversation) {
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      }
      setUploadingFile(false);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFileToBackend = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', `Uploaded from chat: ${file.name}`);

    try {
      const response = await filesApi.uploadFile(formData);
      
      // Show success message
      setFileUploadSuccess(`File "${file.name}" uploaded successfully!`);
      setTimeout(() => setFileUploadSuccess(null), 5000); // Hide after 5 seconds
      
      return response.data;
    } catch (error: any) {
      // Handle specific error messages from backend
      let errorMessage = 'An error occurred while uploading the file. Please try again.';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.non_field_errors) {
          // Display non_field_errors nicely
          errorMessage = Array.isArray(error.response.data.non_field_errors) 
            ? error.response.data.non_field_errors.join('. ') 
            : error.response.data.non_field_errors;
        } else if (error.response.data.file) {
          errorMessage = Array.isArray(error.response.data.file) 
            ? error.response.data.file[0] 
            : error.response.data.file;
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploadingFile(true);
    try {
      await uploadFileToBackend(selectedFile);
      
      // Add a system message to show file was uploaded
      const fileMessage: ChatMessage = {
        id: `file-${Date.now()}`,
        content: `📎 File uploaded: ${selectedFile.name}`,
        message_type: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation: selectedConversation || ''
      };
      
      if (selectedConversation) {
        setMessages(prev => [...prev, fileMessage]);
      }
      
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('File upload failed:', error);
      setFileUploadSuccess(null);
      
      // Show specific error message from backend
      const errorMessage = error.message || 'An error occurred while uploading the file. Please try again.';
      alert(errorMessage);
    } finally {
      setUploadingFile(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Utility functions for ChatGPT-like features
  const htmlToMarkdown = (html: string) => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Convert common HTML elements to markdown
    let markdown = html;
    
    // Headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
    
    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Code
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n');
    markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n');
    
    // Links
    markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    
    // Paragraphs and line breaks
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    markdown = markdown.replace(/<br[^>]*\/?>/gi, '\n');
    markdown = markdown.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');
    
    // Blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n');
    
    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace
    markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
    markdown = markdown.trim();
    
    return markdown;
  };



  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Copy function for markdown content
  const copyMessageAsMarkdown = async (message: ChatMessage) => {
    await copyToClipboard(message.content, message.id);
  };

  // Copy function for styled content (HTML)
  const copyMessageAsHTML = async (message: ChatMessage) => {
    try {
      // Get the rendered HTML content from the message bubble
      const messageElement = document.querySelector(`[data-message-id="${message.id}"] .markdown-content`);
      
      if (messageElement && navigator.clipboard.write) {
        // Create HTML blob for rich text copying
        const htmlContent = messageElement.innerHTML;
        const plainText = messageElement.textContent || message.content;
        
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' })
        });
        
        await navigator.clipboard.write([clipboardItem]);
        setCopiedMessageId(message.id);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } else {
        // Fallback to plain text
        await copyToClipboard(message.content, message.id);
      }
    } catch (error) {
      console.error('Failed to copy styled content:', error);
      // Fallback to markdown copy
      await copyMessageAsMarkdown(message);
    }
  };

  const shareMessage = async (message: ChatMessage) => {
    try {
      if (message.message_type === 'assistant') {
        // For assistant messages, get styled content
        const messageElement = document.querySelector(`[data-message-id="${message.id}"] .markdown-content`);
        
        if (messageElement && navigator.clipboard.write && navigator.share) {
          const htmlContent = messageElement.innerHTML;
          const plainText = messageElement.textContent || message.content;
          const shareText = `Assistant: ${plainText}`;
          
          try {
            await navigator.share({
              title: 'Chat Message (Styled)',
              text: shareText
            });
          } catch (shareError) {
            // Fallback to copying styled content
            const clipboardItem = new ClipboardItem({
              'text/html': new Blob([htmlContent], { type: 'text/html' }),
              'text/plain': new Blob([shareText], { type: 'text/plain' })
            });
            await navigator.clipboard.write([clipboardItem]);
            setCopiedMessageId(message.id);
            setTimeout(() => setCopiedMessageId(null), 2000);
          }
        } else {
          // Fallback to plain text share
          const shareText = `Assistant: ${message.content}`;
          if (navigator.share) {
            await navigator.share({
              title: 'Chat Message',
              text: shareText
            });
          } else {
            copyToClipboard(shareText, message.id);
          }
        }
      } else {
        // For user messages, use plain text
        const shareText = `User: ${message.content}`;
        if (navigator.share) {
          await navigator.share({
            title: 'Chat Message',
            text: shareText
          });
        } else {
          copyToClipboard(shareText, message.id);
        }
      }
    } catch (error) {
      console.error('Failed to share message:', error);
      // Final fallback
      const shareText = `${message.message_type === 'user' ? 'User' : 'Assistant'}: ${message.content}`;
      copyToClipboard(shareText, message.id);
    }
  };

  const shareToGmail = async (message: ChatMessage) => {
    try {
      if (message.message_type === 'assistant') {
        // For assistant messages, copy styled content and open Gmail
        const messageElement = document.querySelector(`[data-message-id="${message.id}"] .markdown-content`);
        
        if (messageElement && navigator.clipboard.write) {
          // Copy styled content to clipboard
          const htmlContent = messageElement.innerHTML;
          const plainText = messageElement.textContent || message.content;
          
          const clipboardItem = new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
          });
          
          await navigator.clipboard.write([clipboardItem]);
          setCopiedMessageId(message.id);
          setTimeout(() => setCopiedMessageId(null), 2000);
          
          // Open Gmail compose with plain text content
          const subject = encodeURIComponent('AI Assistant Response (Styled Content Copied)');
          const body = encodeURIComponent(plainText);
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
          
          window.open(gmailUrl, '_blank');
        } else {
          // Fallback to markdown conversion
          const content = message.content.includes('<') && message.content.includes('>') 
            ? htmlToMarkdown(message.content)
            : message.content;
          
          await navigator.clipboard.writeText(content);
          setCopiedMessageId(message.id);
          setTimeout(() => setCopiedMessageId(null), 2000);
          
          const subject = encodeURIComponent('AI Assistant Response (Markdown)');
          const body = encodeURIComponent(content);
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
          
          window.open(gmailUrl, '_blank');
        }
      } else {
        // For user messages, use plain text
        await navigator.clipboard.writeText(message.content);
        setCopiedMessageId(message.id);
        setTimeout(() => setCopiedMessageId(null), 2000);
        
        const subject = encodeURIComponent('User Message');
        const body = encodeURIComponent(message.content);
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
        
        window.open(gmailUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to share to Gmail:', error);
      // Fallback to just copying markdown
      copyMessageAsMarkdown(message);
    }
  };



  const startEditMessage = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEditAndResend = async () => {
    if (!editingContent.trim() || !selectedConversation) return;

    setLoading(true);
    setIsTyping(true);
    try {
      // Remove the last assistant message if it exists
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.message_type === 'assistant') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      setEditingMessageId(null);
      setEditingContent('');
      
      // Stream the new response
      await streamResponse(editingContent.trim(), selectedConversation);
    } catch (error) {
      console.error('Failed to resend message:', error);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const regenerateResponse = async (userMessage: ChatMessage) => {
    if (!selectedConversation) return;

    setLoading(true);
    setIsTyping(true);
    try {
      // Remove the last assistant message if it exists
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.message_type === 'assistant') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      // Stream the new response
      await streamResponse(userMessage.content, selectedConversation);
    } catch (error) {
      console.error('Failed to regenerate response:', error);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  // Auto-create conversation and send first message
  const sendFirstMessage = async (messageText: string) => {
    try {
      // Create new conversation with auto-generated title
      const conversationTitle = generateConversationTitle(messageText);
      const createRequest: any = {
        title: conversationTitle
      };
      if (newChatFolderId) {
        createRequest.folder = newChatFolderId;
      }
      const conversationResponse = await chatApi.createConversation(createRequest);
      
      // Clear the folder selection after creating the conversation
      setNewChatFolderId(null);
      
      const newConversationId = conversationResponse.data.id;
      setSelectedConversation(newConversationId);
      await loadConversations();
      
      // Update URL with conversation ID and remove folder parameter
      const url = new URL(window.location.href);
      url.searchParams.set('conversation', newConversationId);
      url.searchParams.delete('folder');
      window.history.replaceState({}, '', url.toString());
      
      // Add user message to UI immediately
      const tempUserMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        content: messageText,
        message_type: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation: newConversationId
      };
      setMessages(prev => [...prev, tempUserMessage]);
      
      // Stream the response
      await streamResponse(messageText, newConversationId);
      
      return newConversationId;
    } catch (error) {
      console.error('Failed to create conversation and send message:', error);
      throw error;
    }
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      await chatApi.archiveConversation(conversationId);
      await loadConversations();
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await chatApi.deleteConversation(conversationId);
      await loadConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Feedback functions
  const handleThumbUp = async (message: ChatMessage) => {
    if (feedbackSubmitted.has(message.id)) return;
    
    const lastUserMessage = messages.filter(m => m.message_type === 'user').pop();
    if (!lastUserMessage) return;

    try {
      await chatApi.submitRAGFeedback({
        feedback_type: 'thumbs_up',
        question: lastUserMessage.content,
        answer: message.content,
        comment: 'Helpful response',
        session_id: selectedConversation || undefined
      });
      setFeedbackSubmitted(prev => new Set([...prev, message.id]));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleThumbDown = (message: ChatMessage) => {
    if (feedbackSubmitted.has(message.id)) return;
    
    setCurrentFeedbackMessage(message);
    setFeedbackModalOpen(true);
  };

  const submitNegativeFeedback = async () => {
    if (!currentFeedbackMessage || !feedbackReason.trim()) return;
    
    const lastUserMessage = messages.filter(m => m.message_type === 'user').pop();
    if (!lastUserMessage) return;

    try {
      await chatApi.submitRAGFeedback({
        feedback_type: 'thumbs_down',
        question: lastUserMessage.content,
        answer: currentFeedbackMessage.content,
        comment: feedbackReason.trim(),
        session_id: selectedConversation || undefined
      });
      setFeedbackSubmitted(prev => new Set([...prev, currentFeedbackMessage.id]));
      setFeedbackModalOpen(false);
      setFeedbackReason('');
      setCurrentFeedbackMessage(null);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const closeFeedbackModal = () => {
    setFeedbackModalOpen(false);
    setFeedbackReason('');
    setCurrentFeedbackMessage(null);
  };

  // Show loading spinner during initial data load
  if (contextLoading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center bg-white rounded-lg shadow">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin"></div>
          <p className="text-primary-600 text-lg">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-primary-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-primary-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-primary-900 truncate">
                    {conversations.find(c => c.id === selectedConversation)?.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-2 sm:p-4 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  data-message-id={message.id}
                  className={`group flex ${
                    message.message_type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex flex-col w-full max-w-4xl ${
                    message.message_type === 'user' ? 'items-end' : 'items-start'
                  }`}>
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
                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-2 border border-primary-300 rounded text-base text-primary-900 resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditAndResend}
                                disabled={!editingContent.trim() || loading}
                                className="px-3 py-1 bg-primary-400 text-white rounded text-xs hover:bg-primary-500 disabled:opacity-50"
                              >
                                <Send className="w-3 h-3" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {message.message_type === 'assistant' ? (
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
                            ) : (
                              <p className="text-base leading-relaxed">{message.content}</p>
                            )}
                            
                            {/* Sources section for assistant messages */}
                            {message.message_type === 'assistant' && message.sources && message.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-primary-200">
                                <p className="text-sm font-medium text-primary-700 mb-2">Sources:</p>
                                <div className="space-y-1">
                                  {message.sources.map((source, index) => {
                                    // Check if source is a URL
                                    const isUrl = source.startsWith('http://') || source.startsWith('https://');
                                    const displayText = isUrl ? new URL(source).hostname : (source.split('.')[0] ?? source);
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between bg-primary-50 rounded-md px-3 py-2">
                                        <span className="text-sm text-primary-600 truncate flex-1">{displayText}</span>
                                        {isUrl ? (
                                          <a
                                            href={source}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 p-1 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded transition-colors"
                                            title={`Open ${source}`}
                                          >
                                            <Link2Icon className="w-4 h-4" />
                                          </a>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              // Create a download link for the source document
                                              const link = document.createElement('a');
                                              link.href = `https://farmonrag.omadligrouphq.com/download/${source}`;
                                              link.target = '_blank';
                                              link.click();
                                            }}
                                            className="ml-2 p-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded transition-colors"
                                            title={`Download ${source}`}
                                          >
                                            <LinkIcon className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            <p
                              className={`text-sm mt-2 opacity-70 ${
                                message.message_type === 'user' ? 'text-primary-100' : 'text-primary-500'
                              }`}
                            >
                              {formatDate(message.created_at)}
                            </p>
                          </>
                        )}
                      </div>
                      {message.message_type === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-base font-medium flex-shrink-0">
                          <User2Icon/>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons - Moved to bottom */}
                    {editingMessageId !== message.id && (
                      <div className={`flex gap-1 mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${
                        message.message_type === 'user' ? 'mr-13' : 'ml-13'
                      }`}>
                        <button
                          onClick={() => message.message_type === 'assistant' ? copyMessageAsHTML(message) : copyMessageAsMarkdown(message)}
                          className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
                          title={message.message_type === 'assistant' ? "Copy styled content" : "Copy message"}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => shareMessage(message)}
                          className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
                          title={message.message_type === 'assistant' ? "Share styled content" : "Share message"}
                        >
                          <Share className="w-4 h-4" />
                        </button>
                        
                        {message.message_type === 'assistant' && (
                          <button
                            onClick={() => shareToGmail(message)}
                            className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
                            title="Copy styled content and share via Gmail"
                          >
                            <MailIcon className="w-4 h-4" />
                          </button>
                        )}
                        
                        {message.message_type === 'user' && (
                          <button
                            onClick={() => startEditMessage(message)}
                            className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
                            title="Edit and resend"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {message.message_type === 'assistant' && (
                          <>
                            <button
                              onClick={() => {
                                const userMessages = messages.filter(m => m.message_type === 'user');
                                const lastUserMessage = userMessages[userMessages.length - 1];
                                if (lastUserMessage) regenerateResponse(lastUserMessage);
                              }}
                              disabled={loading}
                              className="p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-md transition-colors disabled:opacity-50"
                              title="Regenerate response"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            
                            {/* Feedback buttons */}
                            <button
                              onClick={() => handleThumbUp(message)}
                              disabled={feedbackSubmitted.has(message.id)}
                              className={`p-1.5 rounded-md transition-colors ${
                                feedbackSubmitted.has(message.id)
                                  ? 'text-success bg-success-50'
                                  : 'text-primary-400 hover:text-success hover:bg-success-50'
                              } disabled:cursor-not-allowed`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleThumbDown(message)}
                              disabled={feedbackSubmitted.has(message.id)}
                              className={`p-1.5 rounded-md transition-colors ${
                                feedbackSubmitted.has(message.id)
                                  ? 'text-error bg-error-50'
                                  : 'text-primary-400 hover:text-error hover:bg-error-50'
                              } disabled:cursor-not-allowed`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>

            {/* File Upload Success Message */}
            {fileUploadSuccess && (
              <div className="mx-2 sm:mx-4 mb-2 p-3 bg-green-100 border border-green-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">{fileUploadSuccess}</span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-2 sm:p-4 border-t border-primary-200">
              {/* Selected file display */}
              {selectedFile && (
                <div className="mb-2 p-2 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PaperclipIcon className="w-4 h-4 text-primary-600" />
                      <span className="text-sm text-primary-700">{selectedFile.name}</span>
                      <span className="text-xs text-primary-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleFileUpload}
                        disabled={uploadingFile}
                        className="px-2 py-1 text-xs bg-primary-400 text-white rounded hover:bg-primary-500 disabled:bg-primary-300 transition-colors"
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        onClick={removeSelectedFile}
                        className="p-1 text-primary-400 hover:text-primary-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploadingFile}
                  className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Attach file"
                >
                  <PaperclipIcon className="w-4 h-4" />
                </button>
                <textarea
                  className="flex-1 resize-none rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent disabled:bg-primary-100 disabled:cursor-not-allowed"
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={loading}
                  style={{ maxHeight: '96px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="px-3 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            {/* ChatGPT-like start screen */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <img src='/farmon_fav.png' alt='logo' className='w-20 h-20 mx-auto rounded-2xl mb-5'/>
                <h1 className="text-3xl font-semibold text-primary-800 mb-2">Hello 👋, {user?.first_name ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1).toLowerCase() : 'there'}! How can I help you?</h1>
              </div>
              
              {/* Selected file display for start screen */}
              {selectedFile && (
                <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PaperclipIcon className="w-4 h-4 text-primary-600" />
                      <span className="text-sm text-primary-700">{selectedFile.name}</span>
                      <span className="text-xs text-primary-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleFileUpload}
                        disabled={uploadingFile}
                        className="px-3 py-1 text-sm bg-primary-400 text-white rounded hover:bg-primary-500 disabled:bg-primary-300 transition-colors"
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        onClick={removeSelectedFile}
                        className="p-1 text-primary-400 hover:text-primary-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Centered input */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploadingFile}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 text-primary-400 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach file"
                >
                  <PaperclipIcon className="w-4 h-4" />
                </button>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="w-full px-12 py-3 pr-12 border border-primary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  rows={1}
                  disabled={loading}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-primary-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Provide Feedback</h2>
            <p className="text-primary-600 mb-4">
              Please tell us why this response wasn't helpful:
            </p>
            <div className="mb-4">
              <textarea
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                placeholder="Enter your feedback..."
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeFeedbackModal}
                className="px-4 py-2 text-primary-600 hover:text-primary-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitNegativeFeedback}
                disabled={!feedbackReason.trim()}
                className="px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:bg-primary-300 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;