import { imageCache } from "@/lib/store";
import { NextResponse } from "next/server";
import { Jimp } from "jimp";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Read the image using Jimp
    let image = await Jimp.read(buffer as any);
    
    // For Roblox, sending huge arrays can crash HttpService or exceed Vercel's response size limit.
    // If the image is extremely large, shrink it slightly.
    if (image.bitmap.width > 256 || image.bitmap.height > 256) {
      if (typeof image.resize === 'function') {
        try {
          // Attempt v1 syntax
          image.resize({ w: 256 });
        } catch(e) {
          try {
             // Attempt v0 syntax fallback
             (image as any).resize(256, (Jimp as any).AUTO);
          } catch(err) {} 
        }
      }
    }

    const { width, height, data } = image.bitmap;
    // data is a Buffer containing r, g, b, a, r, g, b, a...
    // converting it to an array of integers
    const pixels = Array.from(data);

    // Generate a short ID
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    imageCache.set(id, { width, height, pixels });

    // Basic map cleanup to avoid blowing out memory
    if (imageCache.size > 100) {
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }

    return NextResponse.json({ id, width, height });
  } catch (err: any) {
    console.error("Conversion error:", err);
    return NextResponse.json({ error: err.message || "Failed to convert image" }, { status: 500 });
  }
}
