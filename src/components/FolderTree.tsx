import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Move,
  FolderPlus,
} from 'lucide-react';
import { filesApi } from '../services/api';
import { FolderItem } from '../types/files';

interface FolderTreeNode extends FolderItem {
  children: FolderTreeNode[];
}

interface FolderTreeProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
  onCreateFolder: (parentId?: string) => void;
  onEditFolder: (folder: FolderItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onMoveFolder: (folder: FolderItem) => void;
  draggedFile?: string | null;
  dragOverFolder?: string | null;
  onDragOverFolder?: (folderId: string | null) => void;
  onDropFile?: (fileId: string, folderId: string | null) => void;
}

export interface FolderTreeRef {
  refresh: () => void;
}

interface TreeNodeProps {
  folder: FolderTreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: (folderId: string) => void;
  onSelect: (folderId: string) => void;
  isSelected: boolean;
  onCreateFolder: (parentId: string) => void;
  onEditFolder: (folder: FolderItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onMoveFolder: (folder: FolderItem) => void;
  children: FolderTreeNode[];
  draggedFile?: string | null;
  dragOverFolder?: string | null;
  onDragOverFolder?: (folderId: string | null) => void;
  onDropFile?: (fileId: string, folderId: string | null) => void;
  selectedFolderId?: string | null;
  expandedFolders?: Set<string>;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  folder,
  level,
  isExpanded,
  onToggle,
  onSelect,
  isSelected,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
  children,
  draggedFile,
  dragOverFolder,
  onDragOverFolder,
  onDropFile,
  selectedFolderId,
  expandedFolders,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = children.length > 0;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    switch (action) {
      case 'create':
        onCreateFolder(folder.id);
        break;
      case 'edit':
        onEditFolder(folder);
        break;
      case 'delete':
        onDeleteFolder(folder);
        break;
      case 'move':
        onMoveFolder(folder);
        break;
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded relative ${
          isSelected ? 'bg-primary-50 border-r-2 border-primary-500' : ''
        } ${dragOverFolder === folder.id ? 'bg-primary-50 border-2 border-primary-300 border-dashed' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(folder.id)}
        onDragOver={(e) => {
          if (draggedFile && onDragOverFolder) {
            e.preventDefault();
            e.stopPropagation();
            onDragOverFolder(folder.id);
          }
        }}
        onDragLeave={(e) => {
          if (draggedFile && onDragOverFolder) {
            e.preventDefault();
            e.stopPropagation();
            onDragOverFolder(null);
          }
        }}
        onDrop={(e) => {
          if (draggedFile && onDropFile && onDragOverFolder) {
            e.preventDefault();
            e.stopPropagation();
            onDropFile(draggedFile, folder.id);
            onDragOverFolder(null);
          }
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(folder.id);
              }}
              className="p-1 hover:bg-gray-200 rounded mr-1"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          <div className="flex items-center min-w-0 flex-1">
            {isExpanded && hasChildren ? (
              <FolderOpen className="w-4 h-4 mr-2 text-primary-500 flex-shrink-0" />
            ) : (
              <Folder 
                className="w-4 h-4 mr-2 flex-shrink-0" 
                style={{ color: folder.color || '#6B7280' }}
              />
            )}
            <span className="text-sm truncate" title={folder.name}>
              {folder.name}
            </span>
            {folder.files_count > 0 && (
              <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1 rounded">
                {folder.files_count}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={handleMenuClick}
            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
              <button
                onClick={(e) => handleMenuAction('create', e)}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </button>
              <button
                onClick={(e) => handleMenuAction('edit', e)}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Edit className="w-4 h-4 mr-2" />
                Rename
              </button>
              <button
                onClick={(e) => handleMenuAction('move', e)}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Move className="w-4 h-4 mr-2" />
                Move
              </button>
              <button
                onClick={(e) => handleMenuAction('delete', e)}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              folder={child}
              level={level + 1}
              isExpanded={expandedFolders?.has(child.id) || false}
              onToggle={onToggle}
              onSelect={onSelect}
              isSelected={selectedFolderId === child.id}
              onCreateFolder={onCreateFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolder={onMoveFolder}
              children={child.children}
              draggedFile={draggedFile}
              dragOverFolder={dragOverFolder}
              onDragOverFolder={onDragOverFolder}
              onDropFile={onDropFile}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree = forwardRef<FolderTreeRef, FolderTreeProps>(({
  onFolderSelect,
  selectedFolderId,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
  draggedFile,
  dragOverFolder,
  onDragOverFolder,
  onDropFile,
}, ref) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await filesApi.getFolderTree();
      // The API returns { folders: [...], total_folders: number }
      // So we need to extract the folders array from response.data.folders
      setFolders(response.data.folders || []);
    } catch (error) {
      console.error('Error loading folders:', error);
      setFolders([]); // Ensure folders is always an array
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: loadFolders
  }));

  const buildFolderTree = (folders: FolderItem[]): FolderTreeNode[] => {
    const folderMap = new Map<string, FolderTreeNode>();
    const rootFolders: FolderTreeNode[] = [];

    // Create map of all folders with children array
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build tree structure
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;
      if (folder.parent) {
        const parent = folderMap.get(folder.parent);
        if (parent) {
          parent.children.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  };

  const handleToggleExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderSelect = (folderId: string) => {
    onFolderSelect(folderId);
  };

  const folderTree = buildFolderTree(folders);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading folders...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto rounded-xl shadow">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Folders</h3>
          <button
            onClick={() => onCreateFolder()}
            className="p-1 hover:bg-gray-100 rounded"
            title="Create new folder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-2">
        {/* Root folder */}
        <div
          className={`flex items-center py-2 px-2 hover:bg-gray-100 cursor-pointer rounded ${
            selectedFolderId === null ? 'bg-primary-50 border-r-2 border-primary-500' : ''
          } ${dragOverFolder === null && draggedFile ? 'bg-primary-50 border-2 border-primary-300 border-dashed' : ''}`}
          onClick={() => onFolderSelect(null)}
          onDragOver={(e) => {
            if (draggedFile && onDragOverFolder) {
              e.preventDefault();
              e.stopPropagation();
              onDragOverFolder(null);
            }
          }}
          onDragLeave={(e) => {
            if (draggedFile && onDragOverFolder) {
              e.preventDefault();
              e.stopPropagation();
              onDragOverFolder('');
            }
          }}
          onDrop={(e) => {
            if (draggedFile && onDropFile && onDragOverFolder) {
              e.preventDefault();
              e.stopPropagation();
              onDropFile(draggedFile, null);
              onDragOverFolder('');
            }
          }}
        >
          <Folder className="w-4 h-4 mr-2 text-gray-600" />
          <span className="text-sm">All Files</span>
        </div>

        {/* Folder tree */}
        <div className="mt-2">
          {folderTree.map((folder) => (
            <TreeNode
              key={folder.id}
              folder={folder}
              level={0}
              isExpanded={expandedFolders.has(folder.id)}
              onToggle={handleToggleExpand}
              onSelect={handleFolderSelect}
              isSelected={selectedFolderId === folder.id}
              onCreateFolder={onCreateFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolder={onMoveFolder}
              children={folder.children}
              draggedFile={draggedFile}
              dragOverFolder={dragOverFolder}
              onDragOverFolder={onDragOverFolder}
              onDropFile={onDropFile}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
            />
          ))}
        </div>

        {folderTree.length === 0 && (
          <div className="text-center py-8">
            <Folder className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No folders yet</p>
            <button
              onClick={() => onCreateFolder()}
              className="mt-2 text-sm text-primary-500 hover:text-primary-700"
            >
              Create your first folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default FolderTree;