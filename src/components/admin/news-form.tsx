// src/components/admin/news-form.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const NewsForm = ({ initialData }: { initialData?: any }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [featuredImage, setFeaturedImage] = useState(
    initialData?.featuredImage || ""
  );
  const [content, setContent] = useState(initialData?.content || "");
  const [sendTo, setSendTo] = useState<string[]>(initialData?.sendTo || []);
  const [sendToAll, setSendToAll] = useState(initialData?.sendToAll || false);
  const [imageUploadMethod, setImageUploadMethod] = useState<"upload" | "url">(
    initialData?.featuredImage ? "url" : "upload"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setFeaturedImage(initialData.featuredImage || "");
      setContent(initialData.content);
      setSendTo(initialData.sendTo || []);
      setSendToAll(initialData.sendToAll || false);
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Clear the URL input when a file is selected
      setFeaturedImage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return false;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", "news");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to upload image: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      setFeaturedImage(result.data.secure_url || result.data.url || "");

      // Show storage method in development
      if (process.env.NODE_ENV === "development" && result.storage) {
        console.log(`File uploaded using ${result.storage} storage`);
      }

      setUploading(false);
      return true;
    } catch (error) {
      console.error("Error uploading image:", error);
      const errorMessage =
        (error as Error).message || "Failed to upload image. Please try again.";
      setError(`Image upload failed: ${errorMessage}`);
      setUploading(false);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);

    // If using file upload method but no image URL is set, try to upload the file
    if (
      imageUploadMethod === "upload" &&
      selectedFile &&
      (!featuredImage || featuredImage.trim() === "")
    ) {
      const uploadSuccess = await handleUpload();
      // If upload failed, don't submit the form
      if (!uploadSuccess) {
        setSubmitting(false);
        return;
      }
      // If featuredImage is still empty, the upload didn't complete successfully
      if (!featuredImage || featuredImage.trim() === "") {
        setError("Image upload failed. Please try again or use a direct URL.");
        setSubmitting(false);
        return;
      }
    }

    const method = initialData ? "PUT" : "POST";
    const url = "/api/admin/news";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(initialData && { id: initialData.id }),
          title: title.trim(),
          description: description.trim(),
          featuredImage: featuredImage?.trim() || null,
          content: content.trim(),
          sendTo: Array.isArray(sendTo) ? sendTo : [],
          sendToAll: sendToAll || false,
        }),
      });

      if (response.ok) {
        router.push("/admin/news");
        router.refresh(); // Refresh the page to show updated data
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create/update news");
      }
    } catch (error) {
      console.error("Error submitting news form:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-md">
      {error && <div className="mb-4 p-3 text-white rounded">{error}</div>}

      <div className="mb-4">
        <label className="block text-white mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="w-full p-2 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          disabled={submitting}
        />
      </div>

      <div className="mb-4">
        <label className="block text-white mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-2 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          rows={3}
          disabled={submitting}
        />
      </div>

      <div className="mb-4">
        <label className="block text-white mb-2">Featured Image</label>
        <div className="flex space-x-4 mb-2">
          <label className="flex items-center text-white">
            <input
              type="radio"
              checked={imageUploadMethod === "upload"}
              onChange={() => setImageUploadMethod("upload")}
              className="mr-2"
              disabled={submitting}
            />
            Upload Image
          </label>
          <label className="flex items-center text-white">
            <input
              type="radio"
              checked={imageUploadMethod === "url"}
              onChange={() => setImageUploadMethod("url")}
              className="mr-2"
              disabled={uploading || submitting}
            />
            Enter URL
          </label>
        </div>

        {imageUploadMethod === "upload" ? (
          <div className="space-y-2 w-full p-2 rounded-lg text-white  border border-gray-600 focus:border-blue-500 focus:outline-none">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="w-52 rounded border border:primary/20"
              disabled={uploading || submitting}
            />
            {selectedFile && (
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  Selected: {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || submitting}
                  className="px-3 py-1 text-white border border:primary/20 rounded-lg text-sm disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            )}
            {featuredImage && featuredImage.trim() !== "" && (
              <div className="mt-2">
                <p className="text-sm">Image uploaded successfully!</p>
                <img
                  src={featuredImage}
                  alt="Preview"
                  className="mt-2 max-w-xs max-h-32 object-contain"
                />
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="Enter image URL"
            className="w-full p-2 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            disabled={submitting}
          />
        )}
      </div>

      <div className="mb-4">
        <label className="block text-white mb-2">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          required
          rows={6}
          className="w-full p-2 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
          disabled={submitting}
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center text-white">
          <input
            type="checkbox"
            checked={sendToAll}
            onChange={() => setSendToAll(!sendToAll)}
            className="mr-2"
            disabled={submitting}
          />
          Send to All
        </label>
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="cursor-pointer px-4 py-2 bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
          disabled={submitting}
        >
          {submitting
            ? initialData
              ? "Updating..."
              : "Creating..."
            : initialData
            ? "Update News"
            : "Create News"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/news")}
          className="px-4 py-2 border border:primary/20 text-white rounded-lg hover:bg-gray-600 transition-colors"
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default NewsForm;
