
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { config } from 'dotenv';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '9002', 10);

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const HLS_OUTPUT_DIR = path.join(process.cwd(), '.hls-output');

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Serve HLS files
      if (req.url?.startsWith('/hls/')) {
        const filePath = path.join(HLS_OUTPUT_DIR, req.url.replace('/hls/', ''));
        const resolved = path.resolve(filePath);

        // Security: ensure the path is within HLS_OUTPUT_DIR
        if (!resolved.startsWith(HLS_OUTPUT_DIR)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        if (!fs.existsSync(resolved)) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }

        const ext = path.extname(resolved).toLowerCase();
        const contentType = ext === '.m3u8'
          ? 'application/vnd.apple.mpegurl'
          : ext === '.ts'
            ? 'video/mp2t'
            : 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        });

        fs.createReadStream(resolved).pipe(res);
        return;
      }

      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    maxHttpBufferSize: 10 * 1024 * 1024, // 10MB for binary frame data
  });

  // Initialize the Studio Engine
  const { StudioServer } = require('./src/engines/studio/StudioServer');
  new StudioServer(io);

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
