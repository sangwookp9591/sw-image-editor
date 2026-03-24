export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropBounds {
  width: number;
  height: number;
}

export interface FabricCropRect {
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

export interface FabricImageObj {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Constrain a rectangle to a given aspect ratio, keeping the center position.
 * If ratio is null (free crop), returns the rect unchanged.
 */
export function constrainToAspectRatio(
  rect: CropRect,
  ratio: number | null
): CropRect {
  if (ratio === null) {
    return rect;
  }

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  let newWidth: number;
  let newHeight: number;

  // Determine whether to constrain by width or height
  const currentRatio = rect.width / rect.height;

  if (currentRatio > ratio) {
    // Too wide -- constrain width based on height
    newHeight = rect.height;
    newWidth = newHeight * ratio;
  } else {
    // Too tall -- constrain height based on width
    newWidth = rect.width;
    newHeight = newWidth / ratio;
  }

  return {
    x: centerX - newWidth / 2,
    y: centerY - newHeight / 2,
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Clamp a crop region to stay within canvas boundaries.
 * Reduces size if region is larger than bounds, then shifts position.
 */
export function clampCropRegion(
  region: CropRect,
  bounds: CropBounds
): CropRect {
  let { x, y, width, height } = region;

  // Clamp dimensions to bounds
  width = Math.min(width, bounds.width);
  height = Math.min(height, bounds.height);

  // Clamp position so region stays within bounds
  x = Math.max(0, Math.min(x, bounds.width - width));
  y = Math.max(0, Math.min(y, bounds.height - height));

  return { x, y, width, height };
}

/**
 * Convert crop rectangle from canvas/viewport coordinates to actual image
 * pixel coordinates, accounting for image and crop scale transforms.
 */
export function getCropPixelCoords(
  cropRect: FabricCropRect,
  imageObj: FabricImageObj
): { x: number; y: number; width: number; height: number } {
  const imgScaleX = imageObj.scaleX;
  const imgScaleY = imageObj.scaleY;

  const x = (cropRect.left - imageObj.left) / imgScaleX;
  const y = (cropRect.top - imageObj.top) / imgScaleY;
  const width = (cropRect.width * cropRect.scaleX) / imgScaleX;
  const height = (cropRect.height * cropRect.scaleY) / imgScaleY;

  return { x, y, width, height };
}
