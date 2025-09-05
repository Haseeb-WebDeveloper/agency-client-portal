// ==============================================
// RELATION MODELS - TypeScript interfaces with relationships
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
// USER WITH RELATIONS
// ==============================================

export interface UserWithRelations extends User {
  clientMemberships?: ClientMembership[];
  agencyMembership?: AgencyMembership | null;
  roomParticipants?: RoomParticipant[];
  projectAssignments?: ProjectAssignment[];
  activities?: Activity[];
  messages?: Message[];
  createdContracts?: Contract[];
  createdProjects?: Project[];
  createdOffers?: Offer[];
  grantedPermissions?: Permission[];
  permissions?: Permission[];
  assignedTasks?: Task[];
  createdTasks?: Task[];
  updatedTasks?: Task[];
}

// ==============================================
// CLIENT WITH RELATIONS
// ==============================================

export interface ClientWithRelations extends Client {
  memberships?: ClientMembership[];
  contracts?: Contract[];
  offers?: Offer[];
  projects?: Project[];
  rooms?: Room[];
}

// ==============================================
// CONTRACT WITH RELATIONS
// ==============================================

export interface ContractWithRelations extends Contract {
  client?: Client;
  creator?: User | null;
  projects?: Project[];
  offers?: Offer[];
}

// ==============================================
// PROJECT WITH RELATIONS
// ==============================================

export interface ProjectWithRelations extends Project {
  contract?: Contract | null;
  client?: Client;
  creator?: User | null;
  assignments?: ProjectAssignment[];
  tasks?: Task[];
  rooms?: Room[];
  messages?: Message[];
  activities?: Activity[];
}

// ==============================================
// TASK WITH RELATIONS
// ==============================================

export interface TaskWithRelations extends Task {
  project?: Project;
  assignee?: User | null;
  creator?: User | null;
  updater?: User | null;
}

// ==============================================
// OFFER WITH RELATIONS
// ==============================================

export interface OfferWithRelations extends Offer {
  client?: Client;
  creator?: User | null;
  contracts?: Contract[];
}

// ==============================================
// ROOM WITH RELATIONS
// ==============================================

export interface RoomWithRelations extends Room {
  project?: Project | null;
  client?: Client | null;
  participants?: RoomParticipant[];
  messages?: Message[];
  activities?: Activity[];
}

// ==============================================
// MESSAGE WITH RELATIONS
// ==============================================

export interface MessageWithRelations extends Message {
  room?: Room;
  user?: User;
  project?: Project | null;
  parent?: Message | null;
  replies?: Message[];
  attachments?: MessageAttachment[];
}

// ==============================================
// ACTIVITY WITH RELATIONS
// ==============================================

export interface ActivityWithRelations extends Activity {
  actor?: User;
  project?: Project | null;
  room?: Room | null;
}

// ==============================================
// PERMISSION WITH RELATIONS
// ==============================================

export interface PermissionWithRelations extends Permission {
  user?: User;
  granter?: User;
}

// ==============================================
// CLIENT MEMBERSHIP WITH RELATIONS
// ==============================================

export interface ClientMembershipWithRelations extends ClientMembership {
  user?: User;
  client?: Client;
}

// ==============================================
// AGENCY MEMBERSHIP WITH RELATIONS
// ==============================================

export interface AgencyMembershipWithRelations extends AgencyMembership {
  user?: User;
}

// ==============================================
// PROJECT ASSIGNMENT WITH RELATIONS
// ==============================================

export interface ProjectAssignmentWithRelations extends ProjectAssignment {
  project?: Project;
  user?: User;
}

// ==============================================
// ROOM PARTICIPANT WITH RELATIONS
// ==============================================

export interface RoomParticipantWithRelations extends RoomParticipant {
  room?: Room;
  user?: User;
}

// ==============================================
// MESSAGE ATTACHMENT WITH RELATIONS
// ==============================================

export interface MessageAttachmentWithRelations extends MessageAttachment {
  message?: Message;
}
