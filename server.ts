
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { config } from 'dotenv';
import { Server } from 'socket.io';
// import { studioState } from './src/socket/state'; // Replaced by StudioEngine

// Load environment variables from .env file
config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '9002', 10);

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer);

  // Initialize the Studio Engine
  const { StudioServer } = require('./src/engines/studio/StudioServer');
  new StudioServer(io);

  // Replaced manual logic with StudioServer
  // io.on('connection', ...) is now handled inside StudioServer

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
