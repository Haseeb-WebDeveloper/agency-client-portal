import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { saveFileLocally } from "@/lib/local-file-storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Try Cloudinary first, fallback to local storage
    try {
      // Check if Cloudinary is configured
      const hasCloudinaryConfig =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;

      if (hasCloudinaryConfig) {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, {
          folder: folder || "agency-portal",
        });

        return NextResponse.json({
          success: true,
          data: result,
          storage: "cloudinary",
        });
      }
    } catch (cloudinaryError) {
      console.warn(
        "Cloudinary upload failed, falling back to local storage:",
        cloudinaryError
      );
    }

    // Fallback to local storage
    const localResult = await saveFileLocally(file, folder || "uploads");

    return NextResponse.json({
      success: true,
      data: {
        secure_url: localResult.url,
        url: localResult.url,
        type: getFileType(file.type),
        name: file.name,
        size: file.size,
      },
      storage: "local",
    });
  } catch (error) {
    console.error("Upload error:", error);
    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to upload file",
        message: (error as Error).message,
        stack:
          process.env.NODE_ENV === "development"
            ? (error as Error).stack
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Determine file type based on MIME type
 */
function getFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (
    [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/rtf",
    ].includes(mimeType)
  ) {
    return "document";
  }
  return "other";
}
