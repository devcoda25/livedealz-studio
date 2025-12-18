import { NextResponse } from "next/server";
import { createLiveStream } from "@/lib/cloudinary";

export async function POST() {
    try {
        const stream = await createLiveStream();
        return NextResponse.json(stream);
    } catch (error) {
        console.error("Stream creation failed:", error);
        return NextResponse.json({ error: "Failed to create stream" }, { status: 500 });
    }
}
