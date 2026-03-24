import { createFal } from "@ai-sdk/fal";
import { createReplicate } from "@ai-sdk/replicate";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const fal = createFal({
  apiKey: process.env.FAL_API_KEY,
});

export const replicate = createReplicate({
  apiToken: process.env.REPLICATE_API_TOKEN,
});

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Operation-to-provider mapping (per D-14 — swap providers without changing app code)
export const aiProviders = {
  imageGeneration: fal,
  textReplacement: replicate, // ideogram-v3 for typography
  translation: google,
  backgroundRemoval: fal,
  objectRemoval: fal,
  upscaling: fal,
  styleTransfer: fal,
} as const;
