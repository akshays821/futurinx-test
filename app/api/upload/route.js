import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const image = formData.get("image")
    
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert the File object to a Base64 string.
    // Sending raw File streams via Node native fetch to ImgBB often causes chunk hanging (10-20s delays).
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    const body = new FormData()
    body.append("image", base64Image)
    
    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      { method: "POST", body }
    )
    
    const data = await res.json()
    
    if (!data.success) {
      throw new Error(data.error?.message || "Imgbb upload failed")
    }
    
    return NextResponse.json({ url: data.data.url })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
