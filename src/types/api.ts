// ==============================================
// API TYPES - Specific types for API endpoints
// ==============================================

import { User, Client, Project, Task, Message, Activity } from './models';

// ==============================================
// API RESPONSE TYPES
// ==============================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  success: boolean;
  message?: string;
  error?: string;
}

// ==============================================
// SPECIFIC API ENDPOINT TYPES
// ==============================================

// Auth endpoints
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

// Admin endpoints
export interface AdminClientsResponse extends PaginatedResponse<Client> {}
export interface AdminUsersResponse extends PaginatedResponse<User> {}
export interface AdminProjectsResponse extends PaginatedResponse<Project> {}

// Client endpoints
export interface ClientProjectsResponse extends PaginatedResponse<Project> {}
export interface ClientTasksResponse extends PaginatedResponse<Task> {}
export interface ClientMessagesResponse extends PaginatedResponse<Message> {}

// Dashboard endpoints
export interface DashboardResponse {
  stats: {
    totalClients: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalMessages: number;
    unreadMessages: number;
  };
  recentActivities: Activity[];
  upcomingTasks: Task[];
  recentMessages: Message[];
}

// Search endpoints
export interface SearchResponse {
  users: User[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  messages: Message[];
  total: number;
  query: string;
}

// ==============================================
// REQUEST TYPES
// ==============================================

export interface CreateClientRequest {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
}

export interface UpdateClientRequest {
  name?: string;
  description?: string;
  website?: string;
  logo?: string;
  isActive?: boolean;
}

export interface CreateProjectRequest {
  clientId: string;
  contractId?: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: string;
}

export interface CreateMessageRequest {
  roomId: string;
  content: string;
  projectId?: string;
  parentId?: string;
}

export interface UpdateMessageRequest {
  content?: string;
}

// ==============================================
// QUERY PARAMETER TYPES
// ==============================================

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ClientQuery extends PaginationQuery {
  search?: string;
  isActive?: boolean;
}

export interface ProjectQuery extends PaginationQuery {
  search?: string;
  status?: string;
  clientId?: string;
  contractId?: string;
}

export interface TaskQuery extends PaginationQuery {
  search?: string;
  status?: string;
  projectId?: string;
  assignedTo?: string;
  priority?: string;
}

export interface MessageQuery extends PaginationQuery {
  search?: string;
  roomId?: string;
  projectId?: string;
  userId?: string;
}

export interface ActivityQuery extends PaginationQuery {
  actorId?: string;
  projectId?: string;
  roomId?: string;
  verb?: string;
  targetType?: string;
  targetId?: string;
}

// ==============================================
// ERROR TYPES
// ==============================================

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errors?: ValidationError[];
  code?: string;
}

// ==============================================
// WEBSOCKET TYPES
// ==============================================

export interface WebSocketMessage {
  type: 'message' | 'notification' | 'activity' | 'task_update' | 'project_update';
  data: any;
  timestamp: Date;
  roomId?: string;
  projectId?: string;
}

export interface RealtimeMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// ==============================================
// FILE UPLOAD TYPES
// ==============================================

export interface FileUploadResponse {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface FileUploadRequest {
  file: File;
  messageId?: string;
  projectId?: string;
}

// ==============================================
// BULK OPERATIONS
// ==============================================

export interface BulkUpdateRequest {
  ids: string[];
  updates: Record<string, any>;
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkResponse {
  success: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}
