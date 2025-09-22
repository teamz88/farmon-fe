import React, { useState, useEffect, useRef } from 'react';
import {
  CloudUpload,
  Download,
  Trash2,
  Share,
  MoreVertical,
  File,
  Image,
  Video,
  Music,
  FileText,
  AlertCircle,
  Loader2,
  X,
  Grid,
  List,
  Shield,
  Move,
} from 'lucide-react';
import { filesApi } from '../services/api';
import { FileItem, FileStats, FolderItem } from '../types/files';
import { useAuth } from '../hooks/useAuth';
import FolderTree, { FolderTreeRef } from '../components/FolderTree';
import CreateFolderModal from '../components/CreateFolderModal';
import MoveFolderModal from '../components/MoveFolderModal';
import FolderBreadcrumbs from '../components/FolderBreadcrumbs';

const Files: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFile, setMenuFile] = useState<FileItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  
  // Multiple file upload state
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: number}>({});
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Folder-related state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(() => {
    // Load saved folder ID from localStorage
    return localStorage.getItem('files-current-folder-id') || null;
  });
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [folderPath, setFolderPath] = useState<FolderItem[]>([]);
  const [showFolderTree, setShowFolderTree] = useState(true);
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | undefined>();

  // Drag and drop state
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Move to folder modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [fileToMove, setFileToMove] = useState<FileItem | null>(null);

  // Ref for FolderTree component
  const folderTreeRef = useRef<FolderTreeRef>(null);

  useEffect(() => {
    loadFiles();
    loadStats();
  }, [currentFolderId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await filesApi.getFiles({ folder: currentFolderId || undefined });
      setFiles(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await filesApi.getFileStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load file stats:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedUploadFiles(files);
    setUploadDialog(true);
  };

  const handleMultipleFileUpload = async () => {
    if (selectedUploadFiles.length === 0) return;

    try {
      setLoading(true);
      const uploadPromises = selectedUploadFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        
        // Add folder if a folder is currently selected
        if (currentFolderId) {
          formData.append('folder', currentFolderId);
        }

        return filesApi.uploadFile(formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadingFiles(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }
        });
      });

      await Promise.all(uploadPromises);
      
      setUploadDialog(false);
      setSelectedUploadFiles([]);
      setUploadingFiles({});
      
      // Refresh files for the current folder
      await loadFiles();
      await loadStats();
      setError(null);
      
      // If we're in a specific folder, also refresh the folder tree
      if (currentFolderId && folderTreeRef.current) {
        folderTreeRef.current.refresh();
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      setError('Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedUploadFiles(files);
      setUploadDialog(true);
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await filesApi.downloadFile(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      setError('Failed to download file');
    }
  };

  const shareFile = async (fileId: string) => {
    try {
      const response = await filesApi.shareFile(fileId);
      setSelectedFile(prev => prev ? { ...prev, shared_url: response.data.shared_url, is_shared: true } : null);
      await loadFiles();
    } catch (error) {
      console.error('Failed to share file:', error);
      setError('Failed to share file');
    }
  };

  const adminDeleteFile = async (fileId: string) => {
    try {
      await filesApi.adminDeleteFile(fileId);
      await loadFiles();
      await loadStats();
      setError(null);
    } catch (error) {
      console.error('Failed to permanently delete file:', error);
      setError('Failed to permanently delete file');
    }
  };

  const adminBulkDelete = async () => {
    try {
      await filesApi.adminBulkDelete(selectedFiles);
      setSelectedFiles([]);
      await loadFiles();
      await loadStats();
      setError(null);
    } catch (error) {
      console.error('Failed to permanently delete files:', error);
      setError('Failed to permanently delete files');
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await filesApi.deleteFile(fileId);
      await loadFiles();
      await loadStats();
      setError(null);
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError('Failed to delete file');
    }
  };

  const bulkDelete = async () => {
    try {
      await filesApi.bulkAction({
        action: 'delete',
        file_ids: selectedFiles
      });
      setSelectedFiles([]);
      await loadFiles();
      await loadStats();
      setError(null);
    } catch (error) {
      console.error('Failed to delete files:', error);
      setError('Failed to delete files');
    }
  };

  // Folder management functions
  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedFiles([]);
    // Save to localStorage for persistence
    if (folderId) {
      localStorage.setItem('files-current-folder-id', folderId);
    } else {
      localStorage.removeItem('files-current-folder-id');
    }
    // TODO: Load folder details and path
  };

  const handleCreateFolder = (parentId?: string) => {
    setParentFolderId(parentId);
    setEditingFolder(null);
    setCreateFolderModal(true);
  };

  const handleEditFolder = (folder: FolderItem) => {
    setEditingFolder(folder);
    setParentFolderId(undefined);
    setCreateFolderModal(true);
  };

  const handleDeleteFolder = async (folder: FolderItem) => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      try {
        await filesApi.deleteFolder(folder.id);
        await loadFiles();
        if (currentFolderId === folder.id) {
          setCurrentFolderId(null);
        }
      } catch (error) {
        console.error('Failed to delete folder:', error);
        setError('Failed to delete folder');
      }
    }
  };

  const handleMoveFolder = (folder: FolderItem) => {
    // TODO: Implement folder move functionality
    console.log('Move folder:', folder);
  };

  // Move file to folder function
  const moveFileToFolder = async (fileId: string, folderId: string | null) => {
    try {
      await filesApi.moveFileToFolder(fileId, folderId);
      await loadFiles();
      await loadStats(); // Also refresh stats after moving files
      // Refresh folder tree after moving files
      if (folderTreeRef.current) {
        folderTreeRef.current.refresh();
      }
      setDraggedFile(null);
      setDragOverFolder(null);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to move file:', error);
      setError('Failed to move file to folder');
    }
  };

  const handleFolderModalSuccess = () => {
    loadFiles();
    // Refresh folder tree after creating/editing folder
    folderTreeRef.current?.refresh();
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
    if (bytes < 0) return 'Invalid Size';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    if (i >= sizes.length) return 'Size too large';
    
    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const getFileIcon = (fileType: string, category: string) => {
    if (category === 'image') return <Image className="w-4 h-4" />;
    if (category === 'video') return <Video className="w-4 h-4" />;
    if (category === 'audio') return <Music className="w-4 h-4" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: FileItem) => {
    setAnchorEl(event.currentTarget);
    setMenuFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFile(null);
  };

  const handleMoveToFolder = (file: FileItem) => {
    setFileToMove(file);
    setShowMoveModal(true);
    handleMenuClose();
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(selectedFiles.length === files.length ? [] : files.map(f => f.id));
  };

  return (
    <div 
      className={`w-full min-h-screen bg-gray-50 pt-5 ${isDragOver ? 'bg-primary-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="fixed inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-dashed border-primary-400">
            <CloudUpload className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-primary-700">Drop files here to upload</p>
            {currentFolderId && (
              <p className="text-sm text-primary-600 mt-2">Files will be uploaded to current folder</p>
            )}
          </div>
        </div>
      )}
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {error && (
          <div className="mx-3 sm:mx-6 bg-error-50 border border-error-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-error" />
              <span className="text-error-800">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-error hover:text-error-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Folder Tree at Top */}
        {showFolderTree && (
          <div className="mx-3 sm:mx-6 mb-4">
            <FolderTree
              ref={folderTreeRef}
              onFolderSelect={handleFolderSelect}
              selectedFolderId={currentFolderId}
              onCreateFolder={handleCreateFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              onMoveFolder={handleMoveFolder}
              draggedFile={draggedFile}
              dragOverFolder={dragOverFolder}
              onDragOverFolder={setDragOverFolder}
              onDropFile={moveFileToFolder}
            />
          </div>
        )}

        {/* Folder Breadcrumbs */}
        <div className="mx-3 sm:mx-6 mb-4">
          <FolderBreadcrumbs
            currentFolder={currentFolder}
            folderPath={folderPath}
            onNavigate={handleFolderSelect}
          />
        </div>

      {/* Loading State */}
      {loading && files.length === 0 && (
        <div className="mx-3 sm:mx-6 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading files...</p>
        </div>
      )}

      {/* Empty State */}
      {/* {!loading && (
        <div className="mx-3 sm:mx-6 mb-5 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <File className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
          <p className="text-gray-600 mb-4">Upload your first file to get started</p>
          <button
            onClick={() => setUploadDialog(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <CloudUpload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      )} */}

      {/* Toolbar */}
      <div className="mx-3 sm:mx-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Files
            </h2>
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 ml-3">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-primary-500 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-500 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {selectedFiles.length > 0 && (
              <>
                <button
                  onClick={bulkDelete}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-error text-white rounded-lg hover:bg-error-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete Selected ({selectedFiles.length})</span>
                  <span className="sm:hidden">Delete ({selectedFiles.length})</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={adminBulkDelete}
                    className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm border-2 border-red-700"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Permanently Delete ({selectedFiles.length})</span>
                    <span className="sm:hidden">Perm Delete ({selectedFiles.length})</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setUploadDialog(true)}
              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-primary-500 cursor-pointer text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              <CloudUpload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {currentFolderId === null && (
        <div className="mx-3 sm:mx-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <File className="w-5 h-5 mr-2" />
            All files ({files.length})
          </h3>
        </div>
      )}
      
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="mx-3 sm:mx-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => {
                setDraggedFile(file.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDraggedFile(null);
                setDragOverFolder(null);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 focus:ring-2"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => handleSelectFile(file.id)}
                  />
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                    {getFileIcon(file.file_type, file.category)}
                  </div>
                </div>
                <button
                  className="p-1.5 sm:p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={(e) => handleMenuOpen(e, file)}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-3">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate mb-1" title={file.original_name}>
                  {file.original_name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {formatFileSize(file.file_size)} • {file.category}
                </p>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{formatDate(file.created_at)}</span>
                <span>{file.download_count} downloads</span>
              </div>
              
              {file.is_shared && (
                <div className="mb-3">
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                    Shared
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <button
                  title="Download"
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2.5 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[36px] sm:min-h-[32px]"
                  onClick={() => downloadFile(file.id, file.original_name)}
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Download</span>
                </button>
                <button
                  title="Share"
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2.5 sm:py-2 text-xs sm:text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors min-h-[36px] sm:min-h-[32px]"
                  onClick={() => {
                    setSelectedFile(file);
                    setShareDialog(true);
                  }}
                >
                  <Share className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="mx-3 sm:mx-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-3 lg:px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 focus:ring-2"
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedFiles.length > 0 && selectedFiles.length < files.length;
                        }
                      }}
                      checked={files.length > 0 && selectedFiles.length === files.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
                  <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Downloads</th>
                  <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-2 sm:px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] sm:min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                 {files.map((file) => (
                   <tr 
                     key={file.id} 
                     className="hover:bg-gray-50 transition-colors"
                     draggable
                     onDragStart={(e) => {
                       setDraggedFile(file.id);
                       e.dataTransfer.effectAllowed = 'move';
                     }}
                     onDragEnd={() => {
                       setDraggedFile(null);
                       setDragOverFolder(null);
                     }}
                   >
                     <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                       <input
                         type="checkbox"
                         className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 focus:ring-2"
                         checked={selectedFiles.includes(file.id)}
                         onChange={() => handleSelectFile(file.id)}
                       />
                     </td>
                     <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4">
                       <div className="flex items-center space-x-2">
                         <div className="flex-shrink-0">
                           {getFileIcon(file.file_type, file.category)}
                         </div>
                         <div className="min-w-0 flex-1">
                           <div className="text-sm font-medium text-gray-900 truncate" title={file.original_name}>
                             {file.original_name}
                           </div>
                           {/* Mobile-only info */}
                           <div className="sm:hidden text-xs text-gray-500 mt-1 space-y-1">
                             <div>{formatFileSize(file.file_size)} • {file.category}</div>
                             <div className="flex items-center space-x-2">
                               <span>{formatDate(file.created_at)}</span>
                               {file.is_shared && (
                                 <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                                   Shared
                                 </span>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                     </td>
                     <td className="hidden sm:table-cell px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{formatFileSize(file.file_size)}</td>
                     <td className="hidden md:table-cell px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[120px]" title={file.file_type}>{file.file_type}</td>
                     <td className="hidden lg:table-cell px-6 py-3 sm:py-4 whitespace-nowrap">
                       <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                         {file.category}
                       </span>
                     </td>
                     <td className="hidden lg:table-cell px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(file.created_at)}</td>
                     <td className="hidden xl:table-cell px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{file.download_count}</td>
                     <td className="hidden sm:table-cell px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                       {file.is_shared ? (
                         <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                           Shared
                         </span>
                       ) : (
                         <span className="text-xs text-gray-400">Private</span>
                       )}
                     </td>
                     <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                       {/* Desktop Actions */}
                       <div className="hidden sm:flex items-center space-x-1">
                         <button
                           title="Download"
                           className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                           onClick={() => downloadFile(file.id, file.original_name)}
                         >
                           <Download className="w-4 h-4" />
                         </button>
                         <button
                           title="Share"
                           className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                           onClick={() => {
                             setSelectedFile(file);
                             setShareDialog(true);
                           }}
                         >
                           <Share className="w-4 h-4" />
                         </button>
                         <button
                           title="More options"
                           className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                           onClick={(e) => handleMenuOpen(e, file)}
                         >
                           <MoreVertical className="w-4 h-4" />
                         </button>
                       </div>
                       
                       {/* Mobile Actions */}
                       <div className="sm:hidden flex items-center space-x-1">
                         <button
                           title="Download"
                           className="flex items-center space-x-1 px-2 py-1.5 text-xs bg-primary-50 text-primary-500 rounded-md hover:bg-primary-100 transition-colors min-h-[32px]"
                           onClick={() => downloadFile(file.id, file.original_name)}
                         >
                           <Download className="w-3 h-3" />
                           <span>Download</span>
                         </button>
                         <button
                           title="More options"
                           className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors min-h-[32px] min-w-[32px]"
                           onClick={(e) => handleMenuOpen(e, file)}
                         >
                           <MoreVertical className="w-4 h-4" />
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Table Summary */}
          <div className="sm:hidden px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{files.length} files total</span>
              {selectedFiles.length > 0 && (
                <span className="font-medium text-primary-500">
                  {selectedFiles.length} selected
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      {uploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Upload Files</h2>
            <div className="mb-4">
              <input
                accept="*/*"
                className="hidden"
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={loading}
              />
              <label htmlFor="file-upload">
                <div className={`flex items-center justify-center space-x-2 w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  loading 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                    : 'border-gray-300 hover:border-primary-400'
                }`}>
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : (
                    <CloudUpload className="w-8 h-8 text-gray-400" />
                  )}
                  <div className="text-center">
                    <span className="text-gray-600 text-sm sm:text-base block">
                      {loading ? 'Uploading...' : 'Choose Files or Drag & Drop'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      Select multiple files to upload
                      {currentFolderId && ' to current folder'}
                    </span>
                  </div>
                </div>
              </label>
              
              {/* Selected Files List */}
              {selectedUploadFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected Files ({selectedUploadFiles.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedUploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-gray-500 ml-2">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        {uploadingFiles[file.name] !== undefined && (
                          <div className="ml-2 w-12 text-right">
                            {uploadingFiles[file.name]}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setUploadDialog(false);
                  setSelectedUploadFiles([]);
                  setUploadingFiles({});
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              {selectedUploadFiles.length > 0 && (
                <button
                  onClick={handleMultipleFileUpload}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : `Upload ${selectedUploadFiles.length} File${selectedUploadFiles.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {shareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Share File</h2>
            {selectedFile && (
              <div className="mb-4">
                <p className="text-gray-900 mb-4 text-sm sm:text-base break-words">
                  Share: {selectedFile.original_name}
                </p>
                {selectedFile.is_shared && selectedFile.download_url ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Download URL:
                    </p>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm mb-3"
                      value={selectedFile.download_url}
                      readOnly
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedFile.download_url)}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Copy URL
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => shareFile(selectedFile.id)}
                    className="w-full sm:w-auto px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    Generate Share Link
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShareDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {anchorEl && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[120px]"
          style={{
            left: Math.min(anchorEl.getBoundingClientRect().left, window.innerWidth - 140),
            top: anchorEl.getBoundingClientRect().bottom + 5
          }}
        >
          <button
            onClick={() => {
              if (menuFile) downloadFile(menuFile.id, menuFile.original_name);
              handleMenuClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
          <button
            onClick={() => {
              if (menuFile) {
                setSelectedFile(menuFile);
                setShareDialog(true);
              }
              handleMenuClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </button>
          <button
            onClick={() => {
              if (menuFile) handleMoveToFolder(menuFile);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Move className="w-4 h-4 mr-2" />
            Move to Folder
          </button>
          <button
            onClick={() => {
              if (menuFile) deleteFile(menuFile.id);
              handleMenuClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                if (menuFile) adminDeleteFile(menuFile.id);
                handleMenuClose();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-800 hover:bg-red-100 transition-colors border-t border-red-200"
            >
              <Shield className="w-4 h-4 mr-2" />
              Permanently Delete
            </button>
          )}
        </div>
      )}
      
      {/* Click outside to close context menu */}
      {anchorEl && (
        <div 
          className="fixed inset-0 z-40"
          onClick={handleMenuClose}
        />
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={createFolderModal}
        onClose={() => setCreateFolderModal(false)}
        onSuccess={handleFolderModalSuccess}
        parentFolderId={parentFolderId}
        editFolder={editingFolder || undefined}
      />

      {/* Move File to Folder Modal */}
      <MoveFolderModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMoveFile={async (folderId) => {
          if (fileToMove) {
            await moveFileToFolder(fileToMove.id, folderId);
            setShowMoveModal(false);
            setFileToMove(null);
          }
        }}
        fileName={fileToMove?.original_name || ''}
      />
      </div>
    </div>
  );
};

export default Files;