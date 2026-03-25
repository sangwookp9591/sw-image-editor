"use client";

import { useDropzone } from "react-dropzone";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function ImageDropzone() {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 25MB");
      return;
    }

    setUploading(true);
    try {
      // 1. Get presigned URL from our API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { presignedUrl, cdnUrl } = await res.json();

      // 2. Upload directly to S3 via presigned URL
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload to storage");
      }

      toast.success("Image uploaded successfully");

      // 3. Navigate to editor with the CDN URL
      const imageId = cdnUrl.split("/").pop()?.split(".")[0];
      if (imageId) {
        router.push(`/editor/${imageId}`);
      } else {
        router.refresh();
      }
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
    </div>
  );
}
