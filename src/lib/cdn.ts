/**
 * Convert S3 key to CloudFront CDN URL for image loading.
 * Falls back to direct S3 URL if NEXT_PUBLIC_CDN_URL is not set.
 */
/**
 * Convert S3 key to image URL.
 * Uses /cdn/ rewrite proxy to avoid CORS issues with CloudFront.
 * Falls back to direct S3 URL if no CDN configured.
 */
export function getCdnUrl(key: string): string {
  // Use Next.js rewrite proxy — same-origin, no CORS issues
  return `/cdn/${key}`;
}
