# Cloudinary Setup

To use the file upload functionality in the offers system, you need to set up Cloudinary:

## 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Credentials

1. Log into your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy the following values:
   - Cloud Name
   - API Key
   - API Secret

## 3. Add Environment Variables

Add these variables to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## 4. Test the Setup

1. Start your development server: `bun dev`
2. Go to `/admin/offers`
3. Click "Create Offer"
4. Try uploading a file in the "Project Assets" section

## Features

- **File Upload**: Upload images, videos, PDFs, and documents
- **Automatic Optimization**: Cloudinary automatically optimizes images
- **Secure URLs**: All uploaded files get secure HTTPS URLs
- **File Management**: Easy file deletion and management
- **Multiple File Types**: Support for various file formats

## File Types Supported

- **Images**: JPG, PNG, GIF, WebP, SVG
- **Videos**: MP4, MOV, AVI, WebM
- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Spreadsheets**: XLS, XLSX, CSV

## Usage in Code

The file upload functionality is implemented using:

- `src/lib/cloudinary.ts` - Cloudinary configuration and utilities
- `src/hooks/use-file-upload.ts` - React hook for file uploads
- `src/app/api/upload/route.ts` - API endpoint for file uploads
- `src/components/admin/offer-form.tsx` - Form component with upload functionality
