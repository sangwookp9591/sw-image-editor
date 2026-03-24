export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per D-06

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    return { valid: false, error: "File must be JPEG, PNG, or WebP" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File must be under 25MB" };
  }
  return { valid: true };
}
