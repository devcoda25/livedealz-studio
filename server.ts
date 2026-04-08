
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { config } from 'dotenv';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load environment variables from .env file
config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '9002', 10);

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const HLS_OUTPUT_DIR = path.join(process.cwd(), '.hls-output');
const NEXT_DIST_DIR = path.join(process.cwd(), '.next');
const ROUTES_MANIFEST_PATH = path.join(NEXT_DIST_DIR, 'routes-manifest.json');
const PRERENDER_MANIFEST_PATH = path.join(NEXT_DIST_DIR, 'prerender-manifest.json');

let routesManifestEnsured: Promise<void> | null = null;

async function ensureDevRoutesManifest(): Promise<void> {
  if (!dev) return;
  if (fs.existsSync(ROUTES_MANIFEST_PATH) && fs.existsSync(PRERENDER_MANIFEST_PATH)) return;

  if (!routesManifestEnsured) {
    routesManifestEnsured = (async () => {
      await fs.promises.mkdir(NEXT_DIST_DIR, { recursive: true });
      const manifest = {
        version: 3,
        caseSensitive: false,
        rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
        redirects: [],
        headers: [],
        i18n: undefined,
        skipMiddlewareUrlNormalize: false,
      };
      await fs.promises.writeFile(ROUTES_MANIFEST_PATH, JSON.stringify(manifest), 'utf8');

      if (!fs.existsSync(PRERENDER_MANIFEST_PATH)) {
        const prerenderManifest = {
          version: 4,
          routes: {},
          dynamicRoutes: {},
          notFoundRoutes: [],
          preview: {
            previewModeId: crypto.randomBytes(16).toString('hex'),
            previewModeSigningKey: crypto.randomBytes(32).toString('hex'),
            previewModeEncryptionKey: crypto.randomBytes(32).toString('hex'),
          },
        };
        await fs.promises.writeFile(PRERENDER_MANIFEST_PATH, JSON.stringify(prerenderManifest, null, 2), 'utf8');
      }
    })().catch((err) => {
      routesManifestEnsured = null;
      throw err;
    });
  }

  await routesManifestEnsured;
}

app.prepare().then(async () => {
  await ensureDevRoutesManifest();
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

      await ensureDevRoutesManifest();
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
