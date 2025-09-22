import { useState, useEffect } from 'react';
import { X, Folder, Palette } from 'lucide-react';
import { filesApi } from '../services/api';
import { FolderItem } from '../types/files';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentFolderId?: string;
  editFolder?: FolderItem;
}

const FOLDER_COLORS = [
  '#6B7280', // Gray
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentFolderId,
  editFolder,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!editFolder;

  useEffect(() => {
    if (isOpen) {
      if (editFolder) {
        setName(editFolder.name);
        setDescription(editFolder.description || '');
        setColor(editFolder.color || FOLDER_COLORS[0]);
      } else {
        setName('');
        setDescription('');
        setColor(FOLDER_COLORS[0]);
      }
      setError('');
    }
  }, [isOpen, editFolder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isEditing) {
        await filesApi.updateFolder(editFolder.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        });
      } else {
        await filesApi.createFolder({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          parent: parentFolderId || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving folder:', error);
      setError(error.response?.data?.message || 'Failed to save folder');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Folder' : 'Create New Folder'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name *
            </label>
            <input
              type="text"
              id="folderName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter folder name"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label htmlFor="folderDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="folderDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Optional description"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Palette className="w-4 h-4 inline mr-1" />
              Folder Color
            </label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  disabled={loading}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === colorOption
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: colorOption }}
                  title={`Select ${colorOption}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Folder className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Folder' : 'Create Folder'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;