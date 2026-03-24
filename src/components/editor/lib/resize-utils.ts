export function calculateResize(
  current: { width: number; height: number },
  changed: "width" | "height",
  newValue: number,
  locked: boolean
): { width: number; height: number } {
  const clampedValue = Math.max(1, Math.round(newValue));

  if (!locked) {
    return {
      width: changed === "width" ? clampedValue : current.width,
      height: changed === "height" ? clampedValue : current.height,
    };
  }

  const aspectRatio = current.width / current.height;

  if (changed === "width") {
    const newHeight = Math.max(1, Math.round(clampedValue / aspectRatio));
    return { width: clampedValue, height: newHeight };
  }

  const newWidth = Math.max(1, Math.round(clampedValue * aspectRatio));
  return { width: newWidth, height: clampedValue };
}
