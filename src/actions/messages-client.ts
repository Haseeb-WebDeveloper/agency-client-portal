'use server'

import { 
  searchRoomsAndUsers, 
  createRoomByUserIds, 
  createOrFindDMRoom,
  updateRoom,
  addRoomMembers,
  removeRoomMember,
  getRoomInfo,
  getAvailableUsers
} from './messaging'

export async function searchRoomsAndUsersAction(formData: FormData) {
  const q = String(formData.get("q") || "");
  const result = await searchRoomsAndUsers(q);
  return result;
}

export async function createRoomAction(formData: FormData) {
  const name = String(formData.get("name") || "");
  const memberIds = String(formData.get("members") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  
  const newRoom = await createRoomByUserIds({ name, userIds: memberIds });
  return newRoom;
}

export async function createDMRoomAction(userId: string) {
  const room = await createOrFindDMRoom(userId);
  return room;
}

export async function updateRoomAction(roomId: string, data: {
  name?: string;
  description?: string;
  logo?: string | null;
  addMembers?: string[];
  removeMembers?: string[];
}) {
  const { addMembers, removeMembers, ...roomData } = data;
  
  // Update room basic info
  if (Object.keys(roomData).length > 0) {
    await updateRoom(roomId, roomData);
  }
  
  // Add members
  if (addMembers && addMembers.length > 0) {
    await addRoomMembers(roomId, addMembers);
  }
  
  // Remove members
  if (removeMembers && removeMembers.length > 0) {
    for (const userId of removeMembers) {
      await removeRoomMember(roomId, userId);
    }
  }
  
  return { success: true };
}

export async function getRoomInfoAction(roomId: string) {
  return await getRoomInfo(roomId);
}

export async function getAvailableUsersAction() {
  return await getAvailableUsers();
}
