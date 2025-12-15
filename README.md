# Live Studio Pro

This is a Next.js application that provides a real-time creator studio for live streaming. It's built with Next.js (App Router), TypeScript, and uses Socket.IO for real-time communication.

## Core Features

- **Real-time Chat**: Send and receive chat messages instantly.
- **Live Mode Sync**: Synchronize the live/lobby state across all connected clients.
- **Dynamic Stats**: Viewers, sales, and other stats update in real-time.
- **Flash Deals**: Run and sync timed flash deals with a countdown.
- **Moment Markers**: Mark and sync important moments for later clipping.
- **Local Device Preview**: Preview your camera and microphone feed before and during the live stream.
- **AI-Powered Prompts**: Get real-time suggestions to engage your audience based on the chat activity.

## Architecture

This project uses a custom Node.js server to run both the Next.js application and a Socket.IO server in the same process. This is ideal for local development and stateful deployments.

- **Frontend**: Next.js with App Router, React (with Hooks), TypeScript, and Tailwind CSS.
- **Backend**: A custom `server.ts` using Node.js's `http` module.
- **Real-time Layer**: Socket.IO is attached to the Node.js server for bidirectional, low-latency communication.
- **State Management**:
  - **Server-side**: A simple in-memory store (`src/socket/state.ts`) holds the "single source of truth" for the live studio's state (e.g., chat history, live status, stats).
  - **Client-side**: A custom React hook (`src/hooks/useStudioSocket.ts`) connects to the socket server, manages state synchronization using a `useReducer` hook, and provides actions to interact with the backend.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- Node.js (v18.x or later)
- npm or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

To start the development server, which includes both the Next.js app and the Socket.IO server, run:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002). The server automatically watches for file changes and reloads.

Open two browser tabs to `http://localhost:9002/studio` to see real-time features in action.

### Building for Production

To create a production-ready build of the application, run:

```bash
npm run build
```

### Running in Production Mode

After building, you can start the application in production mode with:

```bash
npm run start
```

This will run the optimized version of the application using the custom Node.js server.

## Production Deployment Note

This application's default setup uses a long-running Node.js server for Socket.IO, which maintains state in memory. This is not directly compatible with serverless deployment platforms like Vercel or Netlify, which are stateless.

For production deployment on such platforms, you should consider one of the following approaches:

1.  **Managed WebSocket Service**: Use a third-party service like [Ably](https://ably.com/), [Pusher](https://pusher.com/), or Google Cloud Pub/Sub. These services handle the real-time infrastructure for you and are designed to work in serverless environments. You would replace the Socket.IO server with the SDK of your chosen provider.

2.  **Separate Stateful Server**: Deploy the Socket.IO server as a separate, stateful service on a platform that supports long-running processes (e.g., a small VM, a container service like Google Cloud Run with session affinity, or Heroku). Your Next.js app would then connect to this externally hosted socket server.
