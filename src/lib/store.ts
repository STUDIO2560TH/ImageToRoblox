export interface ImageData {
  width: number;
  height: number;
  pixels: string;
}

const globalForStore = globalThis as unknown as { __imageCache: Map<string, ImageData> };

export const imageCache = globalForStore.__imageCache || new Map<string, ImageData>();

if (process.env.NODE_ENV !== "production") {
  globalForStore.__imageCache = imageCache;
}
