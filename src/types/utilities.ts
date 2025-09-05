// ==============================================
// UTILITY TYPES - Common patterns for API and forms
// ==============================================

import {
  User,
  Client,
  ClientMembership,
  AgencyMembership,
  Contract,
  Project,
  ProjectAssignment,
  Task,
  Offer,
  Room,
  RoomParticipant,
  Message,
  MessageAttachment,
  Activity,
  Permission,
} from './models';

// ==============================================
// CREATE TYPES - For creating new records
// ==============================================

export type CreateUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateClient = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateClientMembership = Omit<ClientMembership, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateAgencyMembership = Omit<AgencyMembership, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateContract = Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateProjectAssignment = Omit<ProjectAssignment, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateOffer = Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateRoom = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateRoomParticipant = Omit<RoomParticipant, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateMessage = Omit<Message, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateMessageAttachment = Omit<MessageAttachment, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateActivity = Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>;
export type CreatePermission = Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>;

// ==============================================
// UPDATE TYPES - For updating existing records
// ==============================================

export type UpdateUser = Partial<Omit<User, 'id' | 'authId' | 'createdAt' | 'updatedAt'>>;
export type UpdateClient = Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateClientMembership = Partial<Omit<ClientMembership, 'id' | 'userId' | 'clientId' | 'createdAt' | 'updatedAt'>>;
export type UpdateAgencyMembership = Partial<Omit<AgencyMembership, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
export type UpdateContract = Partial<Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateProject = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateProjectAssignment = Partial<Omit<ProjectAssignment, 'id' | 'projectId' | 'userId' | 'createdAt' | 'updatedAt'>>;
export type UpdateTask = Partial<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;
export type UpdateOffer = Partial<Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateRoom = Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateRoomParticipant = Partial<Omit<RoomParticipant, 'id' | 'roomId' | 'userId' | 'createdAt' | 'updatedAt'>>;
export type UpdateMessage = Partial<Omit<Message, 'id' | 'roomId' | 'userId' | 'createdAt' | 'updatedAt'>>;
export type UpdateMessageAttachment = Partial<Omit<MessageAttachment, 'id' | 'messageId' | 'createdAt' | 'updatedAt'>>;
export type UpdateActivity = Partial<Omit<Activity, 'id' | 'actorId' | 'createdAt' | 'updatedAt'>>;
export type UpdatePermission = Partial<Omit<Permission, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// ==============================================
// FORM TYPES - For form inputs (making required fields optional)
// ==============================================

export type UserForm = Partial<CreateUser>;
export type ClientForm = Partial<CreateClient>;
export type ContractForm = Partial<CreateContract>;
export type ProjectForm = Partial<CreateProject>;
export type TaskForm = Partial<CreateTask>;
export type OfferForm = Partial<CreateOffer>;
export type RoomForm = Partial<CreateRoom>;
export type MessageForm = Partial<CreateMessage>;

// ==============================================
// API RESPONSE TYPES (moved to api.ts)
// ==============================================

// ==============================================
// FILTER TYPES - For search and filtering
// ==============================================

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
  clientId?: string;
}

export interface ClientFilters {
  isActive?: boolean;
  search?: string;
}

export interface ProjectFilters {
  status?: string;
  clientId?: string;
  contractId?: string;
  search?: string;
}

export interface TaskFilters {
  status?: string;
  projectId?: string;
  assignedTo?: string;
  priority?: string;
  search?: string;
}

export interface MessageFilters {
  roomId?: string;
  projectId?: string;
  userId?: string;
  search?: string;
}

export interface ActivityFilters {
  actorId?: string;
  projectId?: string;
  roomId?: string;
  verb?: string;
  targetType?: string;
  targetId?: string;
}

// ==============================================
// SORT TYPES
// ==============================================

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

// ==============================================
// PAGINATION TYPES
// ==============================================

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: SortOptions;
}

// ==============================================
// AUTH TYPES
// ==============================================

export interface AuthUser {
  id: string;
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

// ==============================================
// DASHBOARD TYPES
// ==============================================

export interface DashboardStats {
  totalClients: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalMessages: number;
  unreadMessages: number;
}

export interface RecentActivity {
  id: string;
  actor: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  verb: string;
  targetType: string;
  targetName: string;
  createdAt: Date;
  metadata?: any;
}

// ==============================================
// NOTIFICATION TYPES
// ==============================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  metadata?: any;
}

// ==============================================
// FILE UPLOAD TYPES
// ==============================================

export interface FileUpload {
  file: File;
  fileName: string;
  fileSize: number;
  mimeType: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// ==============================================
// SEARCH TYPES
// ==============================================

export interface SearchResult<T> {
  data: T[];
  total: number;
  query: string;
  filters?: Record<string, any>;
}

export interface GlobalSearchResult {
  users: User[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  messages: Message[];
  total: number;
}
