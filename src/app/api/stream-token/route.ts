
import { NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('Stream API key or secret is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Initialize Stream Chat with your API key and secret
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    
    // Assign 'admin' role if the user is the creator
    const role = userId === 'live-dealz-creator' ? 'admin' : 'user';
    await serverClient.upsertUser({ id: userId, role });

    // Create a token for the user
    const token = serverClient.createToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error creating Stream token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
