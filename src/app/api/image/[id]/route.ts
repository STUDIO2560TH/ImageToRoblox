import { imageCache } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!id) {
    return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  }

  const data = imageCache.get(id);

  if (!data) {
    return NextResponse.json({ 
      error: "Image not found or has expired. Please upload again." 
    }, { status: 404 });
  }

  // To keep the payload small, we could just send the flat array.
  // Roblox HttpService will parse it directly.
  return NextResponse.json({
    id,
    width: data.width,
    height: data.height,
    pixels: data.pixels
  });
}
