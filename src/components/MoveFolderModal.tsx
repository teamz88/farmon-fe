import React, { useState, useEffect } from 'react';
import { X, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { filesApi } from '../services/api';
import { FolderItem } from '../types/files';

interface FolderTreeNode extends FolderItem {
  children: FolderTreeNode[];
}

interface MoveFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoveFile: (folderId: string | null) => void;
  fileName: string;
}

const MoveFolderModal: React.FC<MoveFolderModalProps> = ({
  isOpen,
  onClose,
  onMoveFile,
  fileName,
}) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await filesApi.getFolderTree();
      // The API returns { folders: [...], total_folders: number }
      const foldersData = response.data.folders || [];
      setFolders(foldersData);
      buildFolderTree(foldersData);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (folders: FolderItem[]): void => {
    const folderMap = new Map<string, FolderTreeNode>();
    const rootFolders: FolderTreeNode[] = [];

    // Create folder nodes
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build tree structure
    folders.forEach(folder => {
      const node = folderMap.get(folder.id)!;
      if (folder.parent) {
        const parent = folderMap.get(folder.parent);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootFolders.push(node);
      }
    });

    setFolderTree(rootFolders);
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

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
  };

  const handleMove = () => {
    onMoveFile(selectedFolderId);
    onClose();
  };

  const renderFolderNode = (folder: FolderTreeNode, level: number = 0) => {
    const hasChildren = folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer rounded ${
            isSelected ? 'bg-primary-50 border-r-2 border-primary-500' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleFolderSelect(folder.id)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExpand(folder.id);
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
              <div className="w-6 h-6 mr-1" />
            )}
            
            {isExpanded && hasChildren ? (
              <FolderOpen className="w-4 h-4 text-primary-500 mr-2" />
            ) : (
              <Folder className="w-4 h-4 text-primary-500 mr-2" />
            )}
            
            <span className="text-sm text-gray-900 truncate">
              {folder.name}
            </span>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {folder.children.map((child) => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Move "{fileName}" to Folder
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Root folder option */}
          <div
            className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer rounded mb-2 ${
              selectedFolderId === null ? 'bg-primary-50 border-r-2 border-primary-500' : ''
            }`}
            onClick={() => handleFolderSelect(null)}
          >
            <Folder className="w-4 h-4 text-primary-500 mr-2" />
            <span className="text-sm text-gray-900">Root Folder</span>
          </div>

          {/* Folder tree */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Loading folders...</div>
              </div>
            ) : folderTree.length > 0 ? (
              <div className="py-2">
                {folderTree.map((folder) => renderFolderNode(folder))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">No folders available</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Move File
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveFolderModal;