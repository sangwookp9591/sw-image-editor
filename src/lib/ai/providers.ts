import { createFal } from "@ai-sdk/fal";
import { createReplicate } from "@ai-sdk/replicate";

export const fal = createFal({
  apiKey: process.env.FAL_API_KEY,
});

export const replicate = createReplicate({
  apiToken: process.env.REPLICATE_API_TOKEN,
});

// Operation-to-provider mapping (per D-14 — swap providers without changing app code)
export const aiProviders = {
  imageGeneration: fal,
  textReplacement: replicate, // ideogram-v3 for typography
  backgroundRemoval: fal,
  objectRemoval: fal,
  upscaling: fal,
  styleTransfer: fal,
} as const;
