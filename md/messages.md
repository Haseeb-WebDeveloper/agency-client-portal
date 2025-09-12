### Messaging system overview

This page explains how the messaging feature works end‑to‑end across server and client components.

### Route and layout

- **Route**: `src/app/(messages)/messages/page.tsx`
- **Layout**: `src/app/(messages)/layout.tsx` wraps content with `AppLayout`, which renders navigation and header chrome.

### URL‑driven room selection

- The selected conversation is driven by the query param `room` in the URL: `/messages?room=<roomId>`.
- The messages page is a Server Component reading `searchParams.room` to decide which room to load.

### Data fetching (server)

In `messages/page.tsx`:

- Fetch current user: `getCurrentUser()`.
- Fetch the user's rooms list: `listMyRooms()`.
- If `searchParams.room` is present:
  - Fetch selected room: `getRoom(roomId)`.
  - Fetch messages with cursor pagination: `getMessages(roomId, { cursor, limit: 50 })`.
  - Mark room as read: `markRoomRead(roomId)`.

These come from `src/actions/messaging.ts` (Server Actions) and run on the server.

### UI structure

- Left pane (server‑rendered): rooms list with search and create‑room trigger.
- Right pane (client‑rendered): `ChatRoom` component with live updates and send box.

### Navigation behavior

- Each room link uses Next.js `Link` to navigate to `/messages?room=...` using client‑side transitions (no hard reload), while still letting the Server Component re‑render with the new `searchParams`.

### Creating rooms (client → server)

- `CreateRoomModal` (`src/components/admin/create-room-modal.tsx`) is a Client Component.
- It:
  - Fetches users for the combobox via `GET /api/messages/users?q=...&limit=10`.
  - Submits a server action `createRoomByUserIds({ name, userIds })` via a form `action`.

### ChatRoom live updates (client)

`src/components/admin/chat-room.tsx` is a Client Component that:

- Initializes Supabase client: `createClient()`.
- Hydrates initial messages from the server prop `initialMessages`.
- Subscribes to realtime Postgres changes on table `messages` filtered by `roomId`:
  - INSERT: append new message if not duplicate and keep list sorted by `createdAt`.
  - UPDATE: merge changes into the message.
  - DELETE: remove the message.
- Manages presence for "typing" indicators using a separate presence channel per room (`presence:room:<roomId>`):
  - Tracks `typing: true/false` and derives a map of active typers.

**Note**: For Realtime to work properly, Row Level Security (RLS) policies must be enabled on the messages table. See [RLS_SETUP.md](../RLS_SETUP.md) for setup instructions.

### Sending messages (client → server)

- The input form in `ChatRoom` posts to a local `clientSend` handler which invokes the server action passed from the page: `onSend(formData)`.
- In the page, `onSend` is implemented as a server action calling `sendMessage(roomId, content)`.
- On success, the input is cleared via a Transition; new messages appear via the realtime subscription.

### Marking rooms read

- When a room is selected (i.e., `searchParams.room` is present and a valid room is loaded), the page calls `markRoomRead(roomId)` server‑side to clear unread counts.

### Pagination

- The server fetch uses cursor‑based pagination: `getMessages(roomId, { cursor, limit })` returns `{ items, nextCursor }`.
- The next cursor (if present) can be passed back into the URL as `?room=<id>&cursor=<cursor>` to fetch older messages. The current UI loads the latest 50 by default.

### Files involved

- `src/app/(messages)/messages/page.tsx`: server orchestration, rooms list, and `ChatRoom` mount.
- `src/components/admin/chat-room.tsx`: realtime updates, presence, send box.
- `src/components/admin/create-room-modal.tsx`: create room UI and user search.
- `src/app/(messages)/layout.tsx` and `src/components/shared/app-layout.tsx`: layout shell.
- `src/actions/messaging.ts`: server actions for rooms/messages.
- `src/app/api/messages/users/route.ts`: user search endpoint for the combobox.

### Notes and potential enhancements

- The current split leverages Server Components for initial data and Client Components for interactivity and realtime.
- For even smoother transitions, consider adding loading states/skeletons or moving the selected room panel into a purely client‑side loader that fetches messages via an API route.
