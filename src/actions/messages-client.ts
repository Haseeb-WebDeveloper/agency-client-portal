'use server'

import { searchRoomsAndUsers, createRoomByUserIds } from './messaging'

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
