import { v2 as cloudinary } from 'cloudinary';
import { MediaFile } from '@/types/models';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any;
  } = {}
): Promise<MediaFile> {
  try {
    // Convert Buffer to base64 string for Cloudinary
    let uploadData: string;
    if (Buffer.isBuffer(file)) {
      uploadData = `data:application/octet-stream;base64,${file.toString('base64')}`;
    } else {
      // For File objects, we need to convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      uploadData = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    }

    const result = await cloudinary.uploader.upload(
      uploadData,
      {
        folder: options.folder || 'agency-portal',
        resource_type: options.resource_type || 'auto',
        public_id: options.public_id,
        transformation: options.transformation,
      }
    );

    // Determine file type based on resource_type and format
    let type: MediaFile['type'] = 'other';
    if (result.resource_type === 'image') {
      type = 'image';
    } else if (result.resource_type === 'video') {
      type = 'video';
    } else if (result.format === 'pdf') {
      type = 'pdf';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(result.format || '')) {
      type = 'document';
    }

    return {
      url: result.secure_url,
      type,
      name: result.original_filename || result.public_id,
      size: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

/**
 * Upload multiple files to Cloudinary
 */
export async function uploadMultipleToCloudinary(
  files: (File | Buffer)[],
  options: {
    folder?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
  } = {}
): Promise<MediaFile[]> {
  try {
    const uploadPromises = files.map(async (file, index) => {
      // Convert each file to base64
      let uploadData: string;
      if (Buffer.isBuffer(file)) {
        uploadData = `data:application/octet-stream;base64,${file.toString('base64')}`;
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        uploadData = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
      }

      const result = await cloudinary.uploader.upload(
        uploadData,
        {
          folder: options.folder || 'agency-portal',
          resource_type: options.resource_type || 'auto',
          public_id: `${options.folder || 'agency-portal'}/${Date.now()}_${index}`,
        }
      );

      // Determine file type based on resource_type and format
      let type: MediaFile['type'] = 'other';
      if (result.resource_type === 'image') {
        type = 'image';
      } else if (result.resource_type === 'video') {
        type = 'video';
      } else if (result.format === 'pdf') {
        type = 'pdf';
      } else if (['doc', 'docx', 'txt', 'rtf'].includes(result.format || '')) {
        type = 'document';
      }

      return {
        url: result.secure_url,
        type,
        name: result.original_filename || result.public_id,
        size: result.bytes,
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw new Error('Failed to upload files to Cloudinary');
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}

/**
 * Get Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations: any = {}
): string {
  return cloudinary.url(publicId, transformations);
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp|mp4|pdf|doc|docx|txt|rtf)/);
  return match ? match[1] : null;
}
