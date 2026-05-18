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
    
    // Force resize to exactly 200x200 to match Python conversion logic
    if (typeof image.resize === 'function') {
      try {
        // Attempt v1 syntax
        image.resize({ w: 200, h: 200 });
      } catch(e) {
        try {
           // Attempt v0 syntax fallback
           (image as any).resize(200, 200);
        } catch(err) {} 
      }
    }

    const { width, height, data } = image.bitmap;
    
    // Format bytes as \xHH string
    const hexArray = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
        hexArray[i] = "\\x" + data[i].toString(16).padStart(2, '0').toUpperCase();
    }
    const hex_string = hexArray.join("");

    // Generate a short ID
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    imageCache.set(id, { width, height, pixels: hex_string });

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
