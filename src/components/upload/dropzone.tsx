"use client";

import { useDropzone } from "react-dropzone";
import { upload } from "@vercel/blob/client";
import { useState } from "react";
import { toast } from "sonner";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/blob";

export function ImageDropzone() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 25MB");
      return;
    }

    setUploading(true);
    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });

      // Client-side fallback: save upload record to DB via /api/upload/record.
      // This ensures the record exists in local dev (where onUploadCompleted
      // does not fire) and acts as a safe no-op duplicate in production
      // (the endpoint uses onConflictDoNothing).
      try {
        await fetch("/api/upload/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: newBlob.url,
            pathname: newBlob.pathname,
            contentType: file.type,
            size: file.size,
          }),
        });
      } catch {
        // Non-fatal: in production onUploadCompleted handles this.
        // Log but don't block the user.
        console.warn("Failed to save upload record via fallback endpoint");
      }

      setUploadedUrl(newBlob.url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error((error as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          flex flex-col items-center justify-center rounded-lg border-2 border-dashed
          p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-muted-foreground">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-primary">Drop the image here</p>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Drag & drop an image here, or click to select
            </p>
            <p className="text-sm text-muted-foreground/60">
              JPEG, PNG, WebP up to 25MB
            </p>
          </div>
        )}
      </div>
      {uploadedUrl && (
        <div className="mt-4">
          <img
            src={uploadedUrl}
            alt="Uploaded"
            className="max-h-64 rounded-lg mx-auto"
          />
        </div>
      )}
    </div>
  );
}
