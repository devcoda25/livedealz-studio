import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export default cloudinary;

export const createLiveStream = async () => {
    // In a real production scenario, you might create unique streams per user.
    // For this demo, we might list existing streams or create a standard one.
    // Cloudinary Live Streaming is currently in Beta/Limited availability or requires specific account request.
    // However, we can simulate the "Stream Key" aspect if the API isn't fully open, 
    // OR we just use standard "Upload" presets if we were doing VOD.
    // But assuming we have Live access or use a standard RTMP ingest if available.

    // If Cloudinary Live API isn't available in standard SDK types yet, we might fallback.
    // Let's assume standard "upload" for now, but really we want "streaming_profiles".

    // For the purpose of this demo and the user's specific request for Cloudinary API:
    // We will assume they have a Cloudinary account enabled for Live Streaming (beta).
    // If not, we might need to fallback to just "Video Player" logic playing a "LIVE" HLS source.

    // Attempt to list streams or create one.
    // This is placeholder logic as the specific "create_live_stream" method varies by account tier.

    return {
        stream_key: "demo_stream_" + Date.now(),
        stream_url: "rtmp://global-live.cloudinary.com:1935/app",
        public_id: "live_" + Date.now(), // The ID we play back
    };
};
