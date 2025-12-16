
import CreatorLiveStudio from './CreatorLiveStudio';

export default function StudioPage() {
  const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

  if (!streamApiKey || streamApiKey === 'your_stream_api_key') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 rounded-lg border p-8">
          <h1 className="text-2xl font-bold">Stream API Key Not Configured</h1>
          <p className="max-w-md text-center text-muted-foreground">
            Your Stream API key is not set. Please add your{' '}
            <code className="font-mono text-sm">NEXT_PUBLIC_STREAM_API_KEY</code>{' '}
            to the <code className="font-mono text-sm">.env</code> file in the
            root of your project.
          </p>
        </div>
      </div>
    );
  }

  return <CreatorLiveStudio streamApiKey={streamApiKey} />;
}
