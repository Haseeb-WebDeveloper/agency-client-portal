# TypeScript Types for Agency Client Portal

This directory contains comprehensive TypeScript type definitions based on the Prisma schema. These types provide type safety and IntelliSense support throughout the application.

## File Structure

```
src/types/
├── enums.ts          # All Prisma enums as TypeScript enums
├── models.ts         # Base model interfaces (1:1 with Prisma models)
├── relations.ts      # Extended models with relationships
├── utilities.ts      # Utility types (Create, Update, Form, Filter types)
├── api.ts           # API-specific types (requests, responses, errors)
├── index.ts         # Main export file
└── README.md        # This documentation
```

## Usage Examples

### Basic Model Usage

```typescript
import { User, Client, Project, UserRole, ProjectStatus } from '@/types';

// Using enums
const userRole: UserRole = UserRole.PLATFORM_ADMIN;
const projectStatus: ProjectStatus = ProjectStatus.IN_PROGRESS;

// Using base models
const user: User = {
  id: '1',
  authId: 'auth-1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.CLIENT,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  // ... other fields
};
```

### Using Relations

```typescript
import { UserWithRelations, ProjectWithRelations } from '@/types';

// Extended models with relationships
const userWithProjects: UserWithRelations = {
  ...user,
  createdProjects: [project1, project2],
  clientMemberships: [membership1],
  // ... other relations
};

const projectWithDetails: ProjectWithRelations = {
  ...project,
  client: client,
  tasks: [task1, task2],
  assignments: [assignment1],
  // ... other relations
};
```

### API Types

```typescript
import { 
  ApiResponse, 
  PaginatedResponse, 
  CreateUser, 
  UpdateUser,
  LoginResponse 
} from '@/types';

// API responses
const userResponse: ApiResponse<User> = {
  data: user,
  success: true,
  message: 'User retrieved successfully'
};

const usersResponse: PaginatedResponse<User> = {
  data: [user1, user2],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  },
  success: true
};

// Request types
const createUserData: CreateUser = {
  authId: 'auth-123',
  email: 'new@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  role: UserRole.CLIENT,
  isActive: true
};

const updateUserData: UpdateUser = {
  firstName: 'Jane Updated',
  isActive: false
};
```

### Form Types

```typescript
import { UserForm, ProjectForm, ClientForm } from '@/types';

// Form data (all fields optional)
const userForm: UserForm = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
  // Other fields are optional
};

const projectForm: ProjectForm = {
  title: 'New Project',
  description: 'Project description',
  clientId: 'client-123'
  // Other fields are optional
};
```

### Filter Types

```typescript
import { UserFilters, ProjectFilters, TaskFilters } from '@/types';

// Filtering data
const userFilters: UserFilters = {
  role: 'CLIENT',
  isActive: true,
  search: 'john'
};

const projectFilters: ProjectFilters = {
  status: 'IN_PROGRESS',
  clientId: 'client-123',
  search: 'website'
};

const taskFilters: TaskFilters = {
  status: 'TODO',
  projectId: 'project-123',
  assignedTo: 'user-123',
  priority: 'high'
};
```

## Available Types

### Enums
- `UserRole` - User roles (PLATFORM_ADMIN, CLIENT, etc.)
- `ProjectStatus` - Project statuses (DRAFT, IN_PROGRESS, etc.)
- `ContractStatus` - Contract statuses (DRAFT, ACTIVE, etc.)
- `TaskStatus` - Task statuses (TODO, IN_PROGRESS, etc.)
- `OfferStatus` - Offer statuses (DRAFT, SENT, etc.)
- `RoomType` - Room types (GENERAL, PROJECT_SPECIFIC, etc.)
- `ActivityVerb` - Activity verbs (CREATED, UPDATED, etc.)
- `PermissionType` - Permission types (READ, WRITE, ADMIN, NONE)
- `AgencyMemberFunction` - Agency member functions (DESIGNER, DEVELOPER, etc.)

### Base Models
- `User` - User model
- `Client` - Client organization model
- `ClientMembership` - User-client relationship
- `AgencyMembership` - Agency member details
- `Contract` - Contract model
- `Project` - Project model
- `ProjectAssignment` - User-project assignment
- `Task` - Task model
- `Offer` - Offer model
- `Room` - Chat room model
- `RoomParticipant` - User-room participation
- `Message` - Message model
- `MessageAttachment` - Message file attachment
- `Activity` - Activity log model
- `Permission` - Permission model

### Relation Models
- `UserWithRelations` - User with all relationships
- `ClientWithRelations` - Client with all relationships
- `ProjectWithRelations` - Project with all relationships
- `TaskWithRelations` - Task with all relationships
- `MessageWithRelations` - Message with all relationships
- And more...

### Utility Types
- `CreateUser`, `CreateClient`, etc. - Types for creating new records
- `UpdateUser`, `UpdateClient`, etc. - Types for updating existing records
- `UserForm`, `ClientForm`, etc. - Form input types (all fields optional)
- `UserFilters`, `ProjectFilters`, etc. - Filter types for search/filtering

### API Types
- `ApiResponse<T>` - Generic API response wrapper
- `PaginatedResponse<T>` - Paginated API response
- `LoginResponse` - Authentication response
- `DashboardResponse` - Dashboard data response
- `CreateUserRequest`, `UpdateUserRequest`, etc. - API request types
- `UserQuery`, `ProjectQuery`, etc. - Query parameter types

## Best Practices

1. **Import from index**: Always import from `@/types` (which points to `src/types/index.ts`)
2. **Use specific types**: Import only the types you need to keep bundles small
3. **Use relations sparingly**: Only use relation types when you actually need the related data
4. **Type your API calls**: Use the API types for request/response validation
5. **Use form types**: Use form types for form inputs to make fields optional
6. **Use filters**: Use filter types for search and filtering functionality

## Type Safety Benefits

- **IntelliSense**: Full autocomplete support in your IDE
- **Compile-time checking**: Catch type errors before runtime
- **Refactoring safety**: Rename/refactor with confidence
- **Documentation**: Types serve as living documentation
- **API validation**: Ensure API requests/responses match expected structure

## Integration with Prisma

These types are designed to work seamlessly with Prisma:

```typescript
import { PrismaClient } from '@prisma/client';
import { User, CreateUser, UpdateUser } from '@/types';

const prisma = new PrismaClient();

// Prisma returns the exact User type
const user: User = await prisma.user.findUnique({
  where: { id: '1' }
});

// Create operations use CreateUser type
const newUser: CreateUser = {
  authId: 'auth-123',
  email: 'new@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'CLIENT',
  isActive: true
};

await prisma.user.create({ data: newUser });

// Update operations use UpdateUser type
const updateData: UpdateUser = {
  firstName: 'John Updated'
};

await prisma.user.update({
  where: { id: '1' },
  data: updateData
});
```

This type system provides comprehensive type safety and developer experience for the entire application.
