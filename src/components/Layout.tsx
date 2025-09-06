import React, { useState, useEffect } from 'react';
import {
  Menu as MenuIcon,
  LayoutDashboard as DashboardIcon,
  MessageSquare as ChatIcon,
  Folder as FolderIcon,
  LogOut as LogoutIcon,
  X as CloseIcon,
  Users as UsersIcon,
  User as UserIcon,
  Plus as PlusIcon,
  Archive as ArchiveIcon,
  Pin as PinIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Pencil as PencilIcon,
  X as XMarkIcon,
  FolderPlus as FolderPlusIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  MoreVertical as MoreVerticalIcon,
  Trash2 as DeleteIcon,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatApi } from '../services/api';
import { Conversation, Folder } from '../types/chat';
import { useChatContext } from '../contexts/ChatContext';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const allMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', adminOnly: true },
  { text: 'Chat', icon: <ChatIcon />, path: '/chat', adminOnly: false },
  { text: 'Profile', icon: <UserIcon />, path: '/profile', adminOnly: false },
  { text: 'Files', icon: <FolderIcon />, path: '/files', adminOnly: false },
  { text: 'Users', icon: <UsersIcon />, path: '/users', adminOnly: true },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6B7280');
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingFolderColor, setEditingFolderColor] = useState('#6B7280');
  const [conversationMenuOpen, setConversationMenuOpen] = useState<string | null>(null);
  const [conversationMenuPosition, setConversationMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedConversation, setDraggedConversation] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { conversations, folders, loadConversations, loadFolders, refreshData, loading } = useChatContext();
  
  const isAdmin = user?.role === 'admin';
  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin);

  const folderColors = [
    '#6B7280', '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E'
  ];

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      if (conversationMenuOpen && conversationMenuPosition) {
        handleConversationMenuClose();
      }
    };
    
    const handleScroll = () => {
      if (conversationMenuOpen) {
        handleConversationMenuClose();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && conversationMenuOpen) {
        handleConversationMenuClose();
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [conversationMenuOpen, conversationMenuPosition]);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await chatApi.createFolder({
        name: newFolderName.trim(),
        color: newFolderColor
      });
      setNewFolderDialog(false);
      setNewFolderName('');
      setNewFolderColor('#6B7280');
      await loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      await chatApi.deleteFolder(folderId);
      await refreshData();
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const startEditingFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setEditingFolderColor(folder.color);
  };

  const saveEditedFolder = async () => {
    if (!editingFolderId || !editingFolderName.trim()) return;
    
    try {
      await chatApi.updateFolder(editingFolderId, {
        name: editingFolderName.trim(),
        color: editingFolderColor
      });
      setEditingFolderId(null);
      setEditingFolderName('');
      setEditingFolderColor('#6B7280');
      await loadFolders();
    } catch (error) {
      console.error('Error updating folder:', error);
    }
  };

  const cancelEditingFolder = () => {
    setEditingFolderId(null);
    setEditingFolderName('');
    setEditingFolderColor('#6B7280');
  };

  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getConversationsByFolder = (folderId: string | null) => {
    return conversations.filter(conv => conv.folder === folderId);
  };

  const handleConversationMenuOpen = (conversationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 300;
    
    let x = rect.right + 10;
    let y = rect.top;
    
    if (x + menuWidth > window.innerWidth) {
      x = rect.left - menuWidth - 10;
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setConversationMenuPosition({ x, y });
    setConversationMenuOpen(conversationId);
  };

  const handleConversationMenuClose = () => {
    setConversationMenuOpen(null);
    setConversationMenuPosition(null);
  };

  const moveConversationToFolder = async (conversationId: string | null, folderId: string | null) => {
    if (!conversationId) return;
    
    try {
      await chatApi.updateConversation(conversationId, { folder: folderId });
      await loadConversations();
      handleConversationMenuClose();
    } catch (error) {
      console.error('Error moving conversation:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await chatApi.deleteConversation(conversationId);
      await loadConversations();
      handleConversationMenuClose();
      
      if (location.pathname === `/chat/${conversationId}`) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const handleNewChat = () => {
    const event = new CustomEvent('newChat');
    window.dispatchEvent(event);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const startEditingTitle = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const saveEditedTitle = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    
    try {
      await chatApi.updateConversation(conversationId, { title: editingTitle.trim() });
      setEditingConversationId(null);
      setEditingTitle('');
      await loadConversations();
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const cancelEditingTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <div className={`sidebar-container bg-gray-50 border-r border-primary-200 z-50 ${
      isMobile ? 'w-full' : ''
    }`}>
      <div className={`flex items-center justify-between h-16 border-b border-primary-200 backdrop-blur-md ${
        isMobile ? 'px-6 border-primary-200' : 'px-4'
      }`}>
        <h1 className={`font-semibold text-primary-800 truncate flex items-center justify-center gap-2 ${
          isMobile ? 'text-xl font-bold' : 'text-lg'
        }`}>
          <img src='/farmon.png' alt='logo' className='w-full h-14' />
        </h1>
        {isMobile && (
          <button
            onClick={handleDrawerToggle}
            className="p-2 rounded-md text-primary-800 hover:text-primary-600 hover:bg-primary-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="mt-4">
        <div className="px-2 mb-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-primary-400 hover:bg-primary-500 rounded-lg transition-colors shadow-lg"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Chat
          </button>
        </div>

        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.text}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-400 text-white'
                    : 'text-primary-800 hover:bg-primary-100 hover:text-primary-900'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.text}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <div className="px-2 mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              Conversations
            </h3>
          </div>
          <div className="px-2 mb-4">
            <button
              onClick={() => setNewFolderDialog(true)}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-primary-400 hover:bg-primary-500 rounded-lg transition-colors shadow-lg"
            >
              <FolderPlusIcon className="h-5 w-5 mr-2" />
              New project
            </button>
          </div>
          <div className="conversations-list px-2 max-h-96 overflow-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                {folders.map((folder) => {
                  const folderConversations = getConversationsByFolder(folder.id);
                  const isExpanded = expandedFolders.has(folder.id);
                  
                  return (
                    <div key={folder.id} className="mb-2">
                      {editingFolderId === folder.id ? (
                        <div className="flex items-center gap-2 p-2 bg-primary-100 rounded-md">
                          <FolderIcon
                            className="h-4 w-4 flex-shrink-0"
                            style={{ color: editingFolderColor }}
                          />
                          <input
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            className="flex-1 text-sm bg-white border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
                            autoFocus
                            onKeyDown={(e) => {
                                         if (e.key === 'Enter') {
                                           saveEditedFolder();
                                         } else if (e.key === 'Escape') {
                                           cancelEditingFolder();
                                         }
                                       }}
                          />
                          <button
                            onClick={saveEditedFolder}
                            className="p-1 text-primary-600 hover:text-primary-500 transition-colors"
                            title="Save"
                          >
                            <CheckIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={cancelEditingFolder}
                            className="p-1 text-primary-600 hover:text-primary-500 transition-colors"
                            title="Cancel"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleFolderExpansion(folder.id)}
                            className={`w-full flex items-center justify-between p-2 text-sm font-medium rounded-md transition-colors hover:bg-primary-100 ${
                              dragOverFolder === folder.id ? 'bg-primary-200' : ''
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverFolder(folder.id);
                            }}
                            onDragLeave={() => {
                              setDragOverFolder(null);
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              if (draggedConversation) {
                                await moveConversationToFolder(draggedConversation, folder.id);
                                setDraggedConversation(null);
                              }
                              setDragOverFolder(null);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <FolderIcon
                                className="h-4 w-4"
                                style={{ color: folder.color }}
                              />
                              <span className="text-primary-800 truncate">{folder.name}</span>
                              <span className="text-xs text-primary-600 bg-primary-200 px-1.5 py-0.5 rounded-full">
                                {folderConversations.length}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingFolder(folder);
                                }}
                                className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-200 rounded transition-colors"
                                title="Edit folder"
                              >
                                <EditIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to delete this folder?')) {
                                    deleteFolder(folder.id);
                                  }
                                }}
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                                title="Delete folder"
                              >
                                <DeleteIcon className="h-3 w-3" />
                              </button>
                              {isExpanded ? (
                                <ChevronDownIcon className="h-3 w-3 text-primary-600" />
                              ) : (
                                <ChevronRightIcon className="h-3 w-3 text-primary-600" />
                              )}
                            </div>
                          </button>
                        </>
                      )}
                      
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {folderConversations.map((conversation) => (
                            <div
                              key={conversation.id}
                              className={`relative group mb-1 rounded-md transition-colors ${
                                draggedConversation === conversation.id 
                                  ? 'bg-primary-200 opacity-50' 
                                  : 'bg-primary-50 hover:bg-primary-100'
                              }`}
                              draggable
                              onDragStart={(e) => {
                                setDraggedConversation(conversation.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                setDraggedConversation(null);
                                setDragOverFolder(null);
                              }}
                            >
                              <button
                                onClick={() => {
                                  navigate(`/chat/${conversation.id}`);
                                  const event = new CustomEvent('conversationSelected', {
                                    detail: { conversationId: conversation.id }
                                  });
                                  window.dispatchEvent(event);
                                  if (isMobile) {
                                    setMobileOpen(false);
                                  }
                                }}
                                className="w-full text-left p-2 rounded-md transition-colors hover:bg-primary-100"
                                disabled={editingConversationId === conversation.id}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {editingConversationId === conversation.id ? (
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                         if (e.key === 'Enter') {
                                           const mouseEvent = e as any;
                                           saveEditedTitle(conversation.id, mouseEvent);
                                         } else if (e.key === 'Escape') {
                                           const mouseEvent = e as any;
                                           cancelEditingTitle(mouseEvent);
                                         }
                                       }}
                                      className="flex-1 text-sm font-medium text-primary-900 bg-primary-100 border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                      autoFocus
                                    />
                                  ) : (
                                    <h4 className="text-sm font-medium text-primary-800 truncate flex-1">
                                      {conversation.title}
                                    </h4>
                                  )}
                                  {conversation.is_pinned && <PinIcon className="h-3 w-3 text-primary-600" />}
                                  {conversation.is_archived && <ArchiveIcon className="h-3 w-3 text-primary-600" />}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-primary-600">
                                    {formatDate(conversation.updated_at)}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-800">
                                    {conversation.message_count}
                                  </span>
                                </div>
                              </button>
                              
                              <div className="absolute top-1 right-1 flex gap-1">
                                {editingConversationId === conversation.id ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        saveEditedTitle(conversation.id, e);
                                      }}
                                      className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-200 rounded transition-colors"
                                      title="Save"
                                    >
                                      <CheckIcon className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        cancelEditingTitle(e);
                                      }}
                                      className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-200 rounded transition-colors"
                                      title="Cancel"
                                    >
                                      <XMarkIcon className="h-3 w-3" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => handleConversationMenuOpen(conversation.id, e)}
                                      className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                                      title="More options"
                                    >
                                      <MoreVerticalIcon className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          <button
                            onClick={() => {
                              const event = new CustomEvent('newChatInFolder', {
                                detail: { folderId: folder.id }
                              });
                              window.dispatchEvent(event);
                              if (isMobile) {
                                setMobileOpen(false);
                              }
                            }}
                            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-dashed border-primary-300"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New chat in {folder.name}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div
                  className={`${draggedConversation ? 'min-h-[40px] border-2 border-dashed border-primary-300 rounded-md mb-2' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverFolder(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    if (draggedConversation) {
                      await moveConversationToFolder(draggedConversation, null);
                      setDraggedConversation(null);
                    }
                  }}
                >
                  {getConversationsByFolder(null).map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`relative group mb-2 rounded-md transition-colors ${
                        draggedConversation === conversation.id 
                          ? 'bg-primary-200 opacity-50' 
                          : 'bg-primary-50 hover:bg-primary-100'
                      }`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedConversation(conversation.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        setDraggedConversation(null);
                        setDragOverFolder(null);
                      }}
                    >
                      <button
                        onClick={() => {
                          navigate(`/chat/${conversation.id}`);
                          const event = new CustomEvent('conversationSelected', {
                            detail: { conversationId: conversation.id }
                          });
                          window.dispatchEvent(event);
                          if (isMobile) {
                            setMobileOpen(false);
                          }
                        }}
                        className="w-full text-left p-3 rounded-md transition-colors hover:bg-primary-100"
                        disabled={editingConversationId === conversation.id}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {editingConversationId === conversation.id ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   const mouseEvent = e as any;
                                   saveEditedTitle(conversation.id, mouseEvent);
                                 } else if (e.key === 'Escape') {
                                   const mouseEvent = e as any;
                                   cancelEditingTitle(mouseEvent);
                                 }
                               }}
                              className="flex-1 text-sm font-medium text-primary-900 bg-primary-100 border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
                              autoFocus
                            />
                          ) : (
                            <h4 className="text-sm font-medium text-primary-800 truncate flex-1">
                              {conversation.title}
                            </h4>
                          )}
                          {conversation.is_pinned && <PinIcon className="h-3 w-3 text-primary-600" />}
                          {conversation.is_archived && <ArchiveIcon className="h-3 w-3 text-primary-600" />}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-primary-600">
                            {formatDate(conversation.updated_at)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-800">
                            {conversation.message_count}
                          </span>
                        </div>
                      </button>
                      
                      <div className="absolute top-2 right-2 flex gap-1">
                        {editingConversationId === conversation.id ? (
                          <>
                            <button
                              onClick={(e) => {
                                saveEditedTitle(conversation.id, e);
                              }}
                              className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-200 rounded transition-colors"
                              title="Save"
                            >
                              <CheckIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                cancelEditingTitle(e);
                              }}
                              className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-200 rounded transition-colors"
                              title="Cancel"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => handleConversationMenuOpen(conversation.id, e)}
                              className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="More options"
                            >
                              <MoreVerticalIcon className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
              )}
            </div>
          </div>
        </nav>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50 w-full">
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-500 ease-in-out ${
        isMobile && mobileOpen
          ? 'opacity-100 visible'
          : 'opacity-0 invisible'
      }`}>
        <div
          className="fixed inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/70 to-primary-900/80 backdrop-blur-sm"
          onClick={handleDrawerToggle}
        />
        <div className={`relative flex-1 flex flex-col w-full h-full bg-transparent transition-transform duration-500 ease-in-out ${
          isMobile && mobileOpen
            ? 'transform translate-x-0'
            : 'transform -translate-x-full'
        }`}>
          {drawer}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`${isMobile ? 'hidden' : 'flex'} flex-col w-60 fixed inset-y-0`}>
        {drawer}
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'w-full' : 'ml-60'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={handleDrawerToggle}
                  className="p-2 rounded-md text-primary-600 hover:text-primary-700 hover:bg-primary-100 mr-2"
                >
                  <MenuIcon className="h-6 w-6" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-primary-900">
                {/* Page title will be set by individual pages */}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* New Chat button for chat page */}
              {location.pathname === '/chat' && (
                <button
                  onClick={handleNewChat}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-400 rounded-md hover:bg-primary-500 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Chat
                </button>
              )}
              {/* Logout button */}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="p-2 rounded-md text-primary-600 hover:text-primary-700 hover:bg-primary-100"
                aria-label="logout"
              >
                <LogoutIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto lg:p-6">
          {children}
        </main>
      </div>

      {/* New Folder Dialog */}
      {newFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">New Folder</h2>
            <div className="mb-4">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                placeholder="Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {folderColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFolderColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newFolderColor === color ? 'border-primary-400 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNewFolderDialog(false);
                  setNewFolderName('');
                  setNewFolderColor('#6B7280');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Context Menu */}
      {conversationMenuOpen && conversationMenuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleConversationMenuClose}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 conversation-menu"
            style={{
              left: conversationMenuPosition.x,
              top: conversationMenuPosition.y
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                const conversation = conversations.find(c => c.id === conversationMenuOpen);
                if (conversation) {
                  startEditingTitle(conversation, e);
                }
                handleConversationMenuClose();
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <div className="menu-divider"></div>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              Move to folder
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveConversationToFolder(conversationMenuOpen, null);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FolderIcon className="h-4 w-4 mr-2 text-gray-400" />
              No folder
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={(e) => {
                  e.stopPropagation();
                  moveConversationToFolder(conversationMenuOpen, folder.id);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FolderIcon
                  className="h-4 w-4 mr-2"
                  style={{ color: folder.color }}
                />
                {folder.name}
              </button>
            ))}
            <div className="menu-divider mt-1 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this conversation?')) {
                    deleteConversation(conversationMenuOpen!);
                  }
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <DeleteIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;