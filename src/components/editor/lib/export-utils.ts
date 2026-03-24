export type ExportFormat = "png" | "jpeg" | "webp";

export interface ExportConfig {
  format: string;
  quality?: number;
  multiplier: number;
}

export function buildExportConfig(
  format: ExportFormat,
  quality: number,
  multiplier: number
): ExportConfig {
  return {
    format,
    quality: format === "png" ? undefined : quality / 100,
    multiplier,
  };
}

export function getFileExtension(format: ExportFormat): string {
  if (format === "jpeg") return "jpg";
  return format;
}

export function getFileName(baseName: string, format: ExportFormat): string {
  return `${baseName}.${getFileExtension(format)}`;
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
