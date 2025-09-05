// ==============================================
// CORE MODELS - TypeScript interfaces for Prisma models
// ==============================================

import {
  UserRole,
  AgencyMemberFunction,
  ProjectStatus,
  ContractStatus,
  OfferStatus,
  RoomType,
  ActivityVerb,
  PermissionType,
  TaskStatus,
} from './enums';

// ==============================================
// CORE USER & ORGANIZATION MODELS
// ==============================================

export interface User {
  id: string;
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface Client {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  logo?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface ClientMembership {
  id: string;
  userId: string;
  clientId: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface AgencyMembership {
  id: string;
  userId: string;
  function: AgencyMemberFunction;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

// ==============================================
// PROJECTS & CONTRACTS
// ==============================================

export interface Contract {
  id: string;
  clientId: string;
  title: string;
  description?: string | null;
  status: ContractStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  value?: number | null; // Decimal as number for simplicity
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface Project {
  id: string;
  contractId?: string | null;
  clientId: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  budget?: number | null; // Decimal as number for simplicity
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

// ==============================================
// TASKS
// ==============================================

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: string | null;
  dueDate?: Date | null;
  assignedTo?: string | null;
  order?: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

// ==============================================
// OFFERS
// ==============================================

export interface Offer {
  id: string;
  clientId: string;
  title: string;
  description?: string | null;
  status: OfferStatus;
  value?: number | null; // Decimal as number for simplicity
  currency: string;
  validUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

// ==============================================
// MESSAGING SYSTEM
// ==============================================

export interface Room {
  id: string;
  name: string;
  description?: string | null;
  type: RoomType;
  projectId?: string | null;
  clientId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface RoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  permission: PermissionType;
  joinedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  projectId?: string | null;
  parentId?: string | null;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

// ==============================================
// ACTIVITY TRACKING
// ==============================================

export interface Activity {
  id: string;
  actorId: string;
  verb: ActivityVerb;
  targetType: string;
  targetId: string;
  metadata?: any | null; // JSON type
  projectId?: string | null;
  roomId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

// ==============================================
// PERMISSIONS & ACCESS CONTROL
// ==============================================

export interface Permission {
  id: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  permission: PermissionType;
  grantedBy: string;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}
