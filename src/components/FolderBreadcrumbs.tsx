import { ChevronRight, Home, Folder } from 'lucide-react';
import { FolderItem } from '../types/files';

interface FolderBreadcrumbsProps {
  currentFolder: FolderItem | null;
  folderPath: FolderItem[];
  onNavigate: (folderId: string | null) => void;
}

const FolderBreadcrumbs: React.FC<FolderBreadcrumbsProps> = ({
  currentFolder,
  folderPath,
  onNavigate,
}) => {
  const handleNavigate = (folderId: string | null) => {
    onNavigate(folderId);
  };

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
      {/* Root/Home */}
      <button
        onClick={() => handleNavigate(null)}
        className="flex items-center px-2 py-1 rounded hover:bg-gray-100 transition-colors"
      >
        <Home className="w-4 h-4 mr-1" />
        <span>All Files</span>
      </button>

      {/* Folder path */}
      {folderPath.map((folder, index) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          <button
            onClick={() => handleNavigate(folder.id)}
            className="flex items-center px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Folder 
              className="w-4 h-4 mr-1" 
              style={{ color: folder.color || '#6B7280' }}
            />
            <span className="max-w-[150px] truncate" title={folder.name}>
              {folder.name}
            </span>
          </button>
        </div>
      ))}

      {/* Current folder (if different from last in path) */}
      {currentFolder && !folderPath.find(f => f.id === currentFolder.id) && (
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          <div className="flex items-center px-2 py-1 bg-primary-50 rounded">
            <Folder 
              className="w-4 h-4 mr-1" 
              style={{ color: currentFolder.color || '#6B7280' }}
            />
            <span className="max-w-[150px] truncate font-medium text-primary-700" title={currentFolder.name}>
              {currentFolder.name}
            </span>
          </div>
        </div>
      )}
    </nav>
  );
};

export default FolderBreadcrumbs;