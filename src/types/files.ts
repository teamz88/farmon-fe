export interface FileItem {
  id: string;
  original_name: string;
  file_name: string;
  file_size: number;
  file_size_human: string;
  file_type: string;
  file_extension: string;
  category: string;
  description?: string;
  tags: string[];
  is_public: boolean;
  is_shared: boolean;
  download_count: number;
  last_accessed?: string;
  status: string;
  upload_progress: number;
  shared_with_count: number;
  comments_count: number;
  versions_count: number;
  can_edit: boolean;
  can_delete: boolean;
  download_url: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  metadata?: Record<string, any>;
}

export interface FileShare {
  id: string;
  file: string;
  shared_with_user?: number;
  shared_url: string;
  access_type: 'view' | 'download' | 'edit';
  expires_at?: string;
  created_at: string;
  is_active: boolean;
}

export interface FileComment {
  id: string;
  file: string;
  user: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface FileVersion {
  id: string;
  file: string;
  version_number: number;
  file_path: string;
  size: number;
  created_at: string;
  created_by: number;
  change_description?: string;
}

export interface FileStats {
  total_files: number;
  total_size: number;
  files_by_category: Record<string, number>;
  files_by_type: Record<string, number>;
  upload_trends: Array<{
    date: string;
    count: number;
    size: number;
  }>;
  top_downloaders: Array<{
    user_id: number;
    username: string;
    download_count: number;
  }>;
}

export interface FileUploadRequest {
  file: File;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface FileShareRequest {
  file_id: string;
  shared_with_user?: number;
  access_type: 'view' | 'download' | 'edit';
  expires_at?: string;
}

export interface FileCommentRequest {
  comment: string;
}

export interface BulkActionRequest {
  action: 'delete' | 'archive' | 'share' | 'move';
  file_ids: string[];
  target_folder?: string;
  share_settings?: FileShareRequest;
}

export interface FileListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FileItem[];
}

export interface FileShareListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FileShare[];
}

export interface FileCommentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FileComment[];
}

export interface FileVersionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FileVersion[];
}

export interface FileAnalytics {
  total_uploads: number;
  total_downloads: number;
  storage_used: number;
  storage_limit: number;
  popular_files: Array<{
    file_id: string;
    name: string;
    download_count: number;
  }>;
  recent_activity: Array<{
    action: string;
    file_name: string;
    user: string;
    timestamp: string;
  }>;
}