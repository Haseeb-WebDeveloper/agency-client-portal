# Client-Agency Platform Database Schema Design

## Overview

This document describes the comprehensive database schema for a client-agency platform built with Supabase Auth, Prisma ORM, and PostgreSQL. The schema supports multi-tenant architecture with role-based access control, real-time messaging, contract management, and comprehensive activity tracking.

## Core Design Principles

- **Normalized Structure**: Follows 3NF to minimize data redundancy
- **Scalable Architecture**: Designed to handle growth in users, contracts, and data
- **Audit Trail**: Comprehensive tracking of all changes with soft deletes
- **Role-Based Access**: Granular permissions for different user types
- **Real-time Ready**: Optimized for Supabase Realtime messaging
- **Multi-tenant**: Supports multiple clients with proper data isolation
- **Contract-Centric**: All work is organized around contracts instead of projects

## Entity Relationship Diagram (Textual)

```
Users (1) ←→ (M) ClientMemberships (M) ←→ (1) Clients
Users (1) ←→ (1) AgencyMemberships
Users (1) ←→ (M) Permissions

Clients (1) ←→ (M) Contracts
Clients (1) ←→ (M) Offers
Clients (1) ←→ (M) Rooms

Contracts (1) ←→ (M) ContractAssignments (M) ←→ (1) Users
Contracts (1) ←→ (M) Tasks
Contracts (1) ←→ (M) Rooms
Contracts (1) ←→ (M) Messages
Contracts (1) ←→ (M) Activities
Offers (M) ←→ (M) Contracts (many-to-many conversion)

Rooms (1) ←→ (M) RoomParticipants (M) ←→ (1) Users
Rooms (1) ←→ (M) Messages
Rooms (1) ←→ (M) Activities

Messages (1) ←→ (M) MessageAttachments
Messages (1) ←→ (M) MessageReplies (self-referencing)

Activities (M) ←→ (1) Users (actor)
Activities (M) ←→ (1) Contracts (optional context)
Activities (M) ←→ (1) Rooms (optional context)
```

## Table Specifications

### Core User & Organization Tables

#### 1. Users
**Primary Key**: `id` (UUID)  
**Unique Constraints**: `authId`, `email`  
**Purpose**: Maps to Supabase auth.users, stores app-specific user data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| authId | String | UNIQUE, NOT NULL | Maps to auth.users.id |
| email | String | UNIQUE, NOT NULL | User email |
| firstName | String | NOT NULL | User's first name |
| lastName | String | NOT NULL | User's last name |
| avatar | String | NULL | Avatar URL |
| role | UserRole | NOT NULL | Platform role |
| isActive | Boolean | DEFAULT true | Account status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `authId` (unique)
- `email` (unique)
- `role`
- `deletedAt`

#### 2. Clients
**Primary Key**: `id` (UUID)  
**Purpose**: Represents client organizations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | String | NOT NULL | Client company name |
| description | String | NULL | Client description |
| website | String | NULL | Client website |
| logo | String | NULL | Client logo URL |
| isActive | Boolean | DEFAULT true | Client status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `name`
- `deletedAt`

#### 3. ClientMemberships
**Primary Key**: `id` (UUID)  
**Unique Constraints**: `(userId, clientId)`  
**Purpose**: Many-to-many relationship between users and clients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| userId | String | FK → Users.id | User reference |
| clientId | String | FK → Clients.id | Client reference |
| role | String | DEFAULT "member" | Client-specific role |
| isActive | Boolean | DEFAULT true | Membership status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `userId`
- `clientId`
- `deletedAt`

#### 4. AgencyMemberships
**Primary Key**: `id` (UUID)  
**Unique Constraints**: `userId`  
**Purpose**: Agency team member roles and functions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| userId | String | FK → Users.id, UNIQUE | User reference |
| function | AgencyMemberFunction | NOT NULL | Agency function |
| isActive | Boolean | DEFAULT true | Membership status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `function`
- `deletedAt`

### Contracts & Tasks

#### 5. Contracts
**Primary Key**: `id` (UUID)  
**Purpose**: Formal agreements between agency and clients with progress tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| clientId | String | FK → Clients.id | Client reference |
| title | String | NOT NULL | Contract title |
| description | String | NULL | Contract description |
| status | ContractStatus | DEFAULT DRAFT | Contract status |
| startDate | DateTime | NULL | Contract start date |
| endDate | DateTime | NULL | Contract end date |
| value | Decimal(10,2) | NULL | Contract value |
| currency | String | DEFAULT "USD" | Currency code |
| budget | Decimal(10,2) | NULL | Contract budget |
| progressPercentage | Int | DEFAULT 0 | Progress percentage (0-100) |
| estimatedHours | Int | NULL | Total estimated hours |
| actualHours | Int | DEFAULT 0 | Hours actually worked |
| priority | Int | DEFAULT 3 | Priority level (1=High, 2=Medium, 3=Low) |
| tags | String[] | NULL | Contract tags for categorization |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `clientId`
- `status`
- `progressPercentage`
- `priority`
- `deletedAt`

#### 6. ContractAssignments
**Primary Key**: `id` (UUID)  
**Unique Constraints**: `(contractId, userId)`  
**Purpose**: Many-to-many relationship between contracts and users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| contractId | String | FK → Contracts.id | Contract reference |
| userId | String | FK → Users.id | User reference |
| role | String | NOT NULL | Contract-specific role |
| isActive | Boolean | DEFAULT true | Assignment status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `contractId`
- `userId`
- `deletedAt`

#### 7. Tasks
**Primary Key**: `id` (UUID)  
**Purpose**: Individual tasks within contracts for progress tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| contractId | String | FK → Contracts.id | Parent contract |
| title | String | NOT NULL | Task title |
| description | String | NULL | Task description |
| status | TaskStatus | DEFAULT TODO | Task status |
| priority | String | DEFAULT "medium" | Task priority |
| dueDate | DateTime | NULL | Task due date |
| assignedTo | String | FK → Users.id | Assigned user |
| order | Int | NULL | Task ordering within contract |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `contractId`
- `status`
- `assignedTo`
- `dueDate`
- `order`
- `deletedAt`

### Offers

#### 8. Offers
**Primary Key**: `id` (UUID)  
**Purpose**: Proposals sent to clients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| clientId | String | FK → Clients.id | Client reference |
| title | String | NOT NULL | Offer title |
| description | String | NULL | Offer description |
| status | OfferStatus | DEFAULT DRAFT | Offer status |
| value | Decimal(10,2) | NULL | Offer value |
| currency | String | DEFAULT "USD" | Currency code |
| validUntil | DateTime | NULL | Offer expiration |
| hasReviewed | Boolean | DEFAULT false | Review status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `clientId`
- `status`
- `validUntil`
- `hasReviewed`
- `deletedAt`

### Messaging System

#### 9. Rooms
**Primary Key**: `id` (UUID)  
**Purpose**: Chat rooms for communication

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | String | NOT NULL | Room name |
| description | String | NULL | Room description |
| type | RoomType | NOT NULL | Room type |
| contractId | String | FK → Contracts.id | Contract-specific room |
| clientId | String | FK → Clients.id | Client-specific room |
| isActive | Boolean | DEFAULT true | Room status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `type`
- `contractId`
- `clientId`
- `deletedAt`

#### 10. RoomParticipants
**Primary Key**: `id` (UUID)  
**Unique Constraints**: `(roomId, userId)`  
**Purpose**: Many-to-many relationship between rooms and users with permissions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| roomId | String | FK → Rooms.id | Room reference |
| userId | String | FK → Users.id | User reference |
| permission | PermissionType | DEFAULT READ | User permission level |
| joinedAt | DateTime | DEFAULT now() | Join timestamp |
| isActive | Boolean | DEFAULT true | Participation status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `roomId`
- `userId`
- `permission`
- `deletedAt`

#### 11. Messages
**Primary Key**: `id` (UUID)  
**Purpose**: Individual messages in rooms

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| roomId | String | FK → Rooms.id | Room reference |
| userId | String | FK → Users.id | Sender reference |
| content | String | NOT NULL | Message content |
| contractId | String | FK → Contracts.id | Optional contract linkage |
| parentId | String | FK → Messages.id | Reply to message |
| isEdited | Boolean | DEFAULT false | Edit status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `(roomId, createdAt)` - **Critical for messaging performance**
- `userId`
- `contractId`
- `parentId`
- `deletedAt`

#### 12. MessageAttachments
**Primary Key**: `id` (UUID)  
**Purpose**: File attachments for messages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| messageId | String | FK → Messages.id | Message reference |
| fileName | String | NOT NULL | Original filename |
| filePath | String | NOT NULL | Storage path |
| fileSize | Int | NOT NULL | File size in bytes |
| mimeType | String | NOT NULL | MIME type |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `messageId`
- `deletedAt`

### Activity Tracking

#### 13. Activities
**Primary Key**: `id` (UUID)  
**Purpose**: Comprehensive activity logging for audit and dashboard feeds

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| actorId | String | FK → Users.id | User who performed action |
| verb | ActivityVerb | NOT NULL | Action type |
| targetType | String | NOT NULL | Target entity type |
| targetId | String | NOT NULL | Target entity ID |
| metadata | Json | NULL | Additional context data |
| contractId | String | FK → Contracts.id | Optional contract context |
| roomId | String | FK → Rooms.id | Optional room context |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `actorId`
- `(targetType, targetId)` - **Critical for activity feeds**
- `contractId`
- `roomId`
- `createdAt` - **Critical for activity feeds**
- `deletedAt`

### Permissions & Access Control

#### 14. Permissions
**Primary Key**: `id` (UUID)  
**Unique Constraints**: `(userId, resourceType, resourceId)`  
**Purpose**: Granular permission system for resource access

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| userId | String | FK → Users.id | User reference |
| resourceType | String | NOT NULL | Resource type (room, contract, etc.) |
| resourceId | String | NOT NULL | Resource ID |
| permission | PermissionType | NOT NULL | Permission level |
| grantedBy | String | FK → Users.id | User who granted permission |
| expiresAt | DateTime | NULL | Permission expiration |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last update timestamp |
| createdBy | String | NULL | Creator user ID |
| updatedBy | String | NULL | Last updater user ID |
| deletedAt | DateTime | NULL | Soft delete timestamp |

**Indexes**:
- `userId`
- `(resourceType, resourceId)`
- `permission`
- `expiresAt`
- `deletedAt`

## Enumerations

### UserRole
- `PLATFORM_ADMIN` - Main platform owner
- `CLIENT` - Client organization owner
- `CLIENT_MEMBER` - Member of a client organization
- `AGENCY_MEMBER` - Agency team member

### AgencyMemberFunction
- `DESIGNER` - Design team member
- `DEVELOPER` - Development team member
- `SALES` - Sales team member
- `PROJECT_MANAGER` - Project management
- `ACCOUNT_MANAGER` - Client account management
- `CREATIVE_DIRECTOR` - Creative leadership
- `TECHNICAL_LEAD` - Technical leadership

### ContractStatus
- `DRAFT` - Initial contract creation
- `PENDING_APPROVAL` - Awaiting approval
- `ACTIVE` - Contract in effect
- `COMPLETED` - Contract fulfilled
- `TERMINATED` - Contract ended early
- `EXPIRED` - Contract expired

### OfferStatus
- `DRAFT` - Initial offer creation
- `SENT` - Offer sent to client
- `ACCEPTED` - Client accepted offer
- `DECLINED` - Client declined offer
- `EXPIRED` - Offer expired
- `WITHDRAWN` - Agency withdrew offer

### RoomType
- `GENERAL` - General communication
- `CONTRACT_SPECIFIC` - Contract-specific room
- `CLIENT_SPECIFIC` - Client-specific room
- `AGENCY_INTERNAL` - Internal agency room

### ActivityVerb
- `CREATED` - Entity created
- `UPDATED` - Entity updated
- `DELETED` - Entity deleted
- `STATUS_CHANGED` - Status changed
- `ASSIGNED` - User assigned
- `UNASSIGNED` - User unassigned
- `MESSAGE_SENT` - Message sent
- `FILE_UPLOADED` - File uploaded
- `FILE_DOWNLOADED` - File downloaded
- `CONTRACT_SIGNED` - Contract signed
- `OFFER_ACCEPTED` - Offer accepted
- `OFFER_DECLINED` - Offer declined
- `TASK_CREATED` - Task created
- `TASK_UPDATED` - Task updated
- `TASK_COMPLETED` - Task completed
- `TASK_ASSIGNED` - Task assigned
- `TASK_UNASSIGNED` - Task unassigned

### PermissionType
- `READ` - Read-only access
- `WRITE` - Read and write access
- `ADMIN` - Full administrative access
- `NONE` - No access

### TaskStatus
- `TODO` - Task not started
- `IN_PROGRESS` - Task in progress
- `IN_REVIEW` - Task under review
- `COMPLETED` - Task completed
- `CANCELLED` - Task cancelled
- `ON_HOLD` - Task on hold

## Performance Optimizations

### Critical Indexes for Messaging
- `messages(roomId, createdAt)` - **Essential for real-time message loading**
- `room_participants(roomId)` - **Fast participant lookup**
- `room_participants(userId)` - **User's room membership**

### Critical Indexes for Activity Feeds
- `activities(targetType, targetId)` - **Entity-specific activity lookup**
- `activities(createdAt)` - **Chronological activity feeds**
- `activities(contractId)` - **Contract-specific activity feeds**

### Critical Indexes for Task Management
- `tasks(contractId)` - **Contract task lookup**
- `tasks(status)` - **Task status filtering**
- `tasks(assignedTo)` - **User task assignments**

### General Performance Indexes
- All foreign key columns are indexed
- All `deletedAt` columns are indexed for soft delete queries
- Status columns are indexed for filtering
- Unique constraints provide automatic indexes

## Soft Delete Strategy

All tables implement soft delete using the `deletedAt` timestamp:
- `deletedAt IS NULL` = Active record
- `deletedAt IS NOT NULL` = Soft deleted record
- All queries should include `WHERE deletedAt IS NULL` for active records
- Indexes on `deletedAt` ensure efficient soft delete queries

## Audit Trail

Every table includes comprehensive audit fields:
- `createdAt` - Record creation timestamp
- `updatedAt` - Last update timestamp (auto-updated)
- `createdBy` - User who created the record
- `updatedBy` - User who last updated the record
- `deletedAt` - Soft delete timestamp

## Security Considerations

1. **Row Level Security (RLS)**: Implement Supabase RLS policies for data isolation
2. **Permission System**: Granular permissions for resource access
3. **Audit Trail**: Complete tracking of all changes
4. **Soft Deletes**: Data retention and recovery capabilities
5. **Foreign Key Constraints**: Data integrity enforcement

## Migration Strategy

1. **Phase 1**: Core user and organization tables
2. **Phase 2**: Contracts and tasks
3. **Phase 3**: Messaging system
4. **Phase 4**: Activity tracking and permissions
5. **Phase 5**: Performance optimizations and indexes

## Scalability Considerations

1. **Partitioning**: Consider partitioning large tables (messages, activities) by date
2. **Archiving**: Implement data archiving for old messages and activities
3. **Caching**: Use Redis for frequently accessed data
4. **Read Replicas**: Use read replicas for reporting queries
5. **Connection Pooling**: Implement proper connection pooling for high concurrency

## Contract-Centric Architecture Benefits

1. **Simplified Workflow**: All work is organized around contracts
2. **Clear Progress Tracking**: Contract progress is tracked through tasks
3. **Better Client Communication**: Clients see contract progress, not project details
4. **Unified Messaging**: All contract-related communication in one place
5. **Streamlined Permissions**: Contract-based access control is simpler to manage

This schema provides a solid foundation for a scalable client-agency platform with comprehensive features for contract management, communication, and collaboration.
