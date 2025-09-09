import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

/**
 * Save a file locally and return its URL
 */
export async function saveFileLocally(
  file: File,
  folder: string = 'uploads'
): Promise<{ url: string; path: string }> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', folder);
    await mkdir(uploadsDir, { recursive: true });

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'bin';
    const filename = `${nanoid()}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Return URL (relative to public directory)
    const url = `/${folder}/${filename}`;
    
    return {
      url,
      path: filepath
    };
  } catch (error) {
    console.error('Local file storage error:', error);
    throw new Error(`Failed to save file locally: ${(error as Error).message}`);
  }
}

/**
 * Delete a locally stored file
 */
export async function deleteLocalFile(filepath: string): Promise<void> {
  try {
    // In a real implementation, you would delete the file from the filesystem
    // For now, we'll just log that deletion was requested
    console.log(`Requested deletion of file: ${filepath}`);
  } catch (error) {
    console.error('Local file deletion error:', error);
    throw new Error(`Failed to delete file: ${(error as Error).message}`);
  }
}