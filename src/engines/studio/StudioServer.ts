import { Server as SocketIOServer, Socket } from 'socket.io';
import { studioStore } from './StudioStore';
import { StudioState, ChatMessage, FlashDeal } from './types';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class StudioServer {
    private io: SocketIOServer;

    // WebRTC signaling: map streamId -> set of viewer socket IDs
    private streamRooms: Map<string, Set<string>> = new Map();
    // WebRTC signaling: map streamId -> publisher socket ID
    private publishers: Map<string, string> = new Map();

    // RTMP relay: active FFmpeg processes per stream
    private rtmpProcesses: Map<string, ChildProcess> = new Map();

    // HLS segmenter: active FFmpeg processes per stream
    private hlsProcesses: Map<string, ChildProcess> = new Map();

    // HLS output directory
    private hlsOutputDir: string;

    constructor(io: SocketIOServer) {
        this.io = io;
        this.hlsOutputDir = path.join(process.cwd(), '.hls-output');
        if (!fs.existsSync(this.hlsOutputDir)) {
            fs.mkdirSync(this.hlsOutputDir, { recursive: true });
        }
        this.initialize();
    }

    private initialize() {
        // connect store to io for broadcasting
        studioStore.attach(this.io);

        this.io.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
        });
    }

    private handleConnection(socket: Socket) {
        console.log(`[StudioEngine] Client connected: ${socket.id}`);

        // Send initial complete state
        socket.emit('state:full', studioStore.getState());

        // Event Handlers
        this.handleChat(socket);
        this.handleDeals(socket);
        this.handleWebRTCSignaling(socket);
        this.handleRTMP(socket);
        this.handleHLS(socket);

        socket.on('disconnect', () => {
            console.log(`[StudioEngine] Client disconnected: ${socket.id}`);
            this.cleanupSocket(socket.id);
        });
    }

    private handleChat(socket: Socket) {
        socket.on('chat:message', (msg: ChatMessage) => {
            studioStore.addMessage(msg);
        });
    }

    private handleDeals(socket: Socket) {
        socket.on('flash:start', (deal: FlashDeal) => {
            console.log(`[StudioEngine] Flash Deal Started: ${deal.discountPct}%`);
            studioStore.setFlashDeal(deal);
        });

        socket.on('flash:stop', () => {
            console.log(`[StudioEngine] Flash Deal Stopped`);
            studioStore.setFlashDeal(null);
        });
    }

    // ==========================================
    // WebRTC Signaling
    // ==========================================

    private handleWebRTCSignaling(socket: Socket) {
        // Publisher starts a stream
        socket.on('webrtc:publish-start', (data: { streamId: string }) => {
            const { streamId } = data;
            console.log(`[WebRTC] Publisher ${socket.id} starting stream: ${streamId}`);
            this.publishers.set(streamId, socket.id);
            socket.join(`stream:${streamId}`);
            socket.emit('webrtc:publish-ready', { streamId });
        });

        // Publisher sends an offer
        socket.on('webrtc:offer', (data: { streamId: string; sdp: RTCSessionDescriptionInit; targetId?: string }) => {
            const { streamId, sdp, targetId } = data;
            console.log(`[WebRTC] Offer from ${socket.id} for stream ${streamId}`);

            if (targetId) {
                // Send to specific viewer
                this.io.to(targetId).emit('webrtc:offer', {
                    streamId,
                    sdp,
                    publisherId: socket.id,
                });
            } else {
                // Broadcast to all viewers in the room
                socket.to(`stream:${streamId}`).emit('webrtc:offer', {
                    streamId,
                    sdp,
                    publisherId: socket.id,
                });
            }
        });

        // Viewer sends an answer
        socket.on('webrtc:answer', (data: { streamId: string; sdp: RTCSessionDescriptionInit; publisherId: string }) => {
            const { streamId, sdp, publisherId } = data;
            console.log(`[WebRTC] Answer from ${socket.id} to publisher ${publisherId}`);
            this.io.to(publisherId).emit('webrtc:answer', {
                streamId,
                sdp,
                viewerId: socket.id,
            });
        });

        // ICE candidate exchange
        socket.on('webrtc:ice-candidate', (data: { streamId: string; candidate: RTCIceCandidateInit; targetId?: string }) => {
            const { streamId, candidate, targetId } = data;

            if (targetId) {
                this.io.to(targetId).emit('webrtc:ice-candidate', {
                    streamId,
                    candidate,
                    fromId: socket.id,
                });
            } else {
                socket.to(`stream:${streamId}`).emit('webrtc:ice-candidate', {
                    streamId,
                    candidate,
                    fromId: socket.id,
                });
            }
        });

        // Viewer joins a stream
        socket.on('webrtc:join-stream', (data: { streamId: string }) => {
            const { streamId } = data;
            console.log(`[WebRTC] Viewer ${socket.id} joining stream: ${streamId}`);

            if (!this.streamRooms.has(streamId)) {
                this.streamRooms.set(streamId, new Set());
            }
            this.streamRooms.get(streamId)!.add(socket.id);
            socket.join(`stream:${streamId}`);

            // Notify publisher that a viewer joined
            const publisherId = this.publishers.get(streamId);
            if (publisherId) {
                this.io.to(publisherId).emit('webrtc:viewer-joined', {
                    streamId,
                    viewerId: socket.id,
                });
            }

            socket.emit('webrtc:stream-joined', {
                streamId,
                publisherId: publisherId || null,
            });
        });

        // Viewer leaves a stream
        socket.on('webrtc:leave-stream', (data: { streamId: string }) => {
            const { streamId } = data;
            this.handleViewerLeave(socket.id, streamId);
        });

        // Publisher stops stream
        socket.on('webrtc:publish-stop', (data: { streamId: string }) => {
            const { streamId } = data;
            console.log(`[WebRTC] Publisher stopping stream: ${streamId}`);

            // Notify all viewers
            socket.to(`stream:${streamId}`).emit('webrtc:stream-ended', { streamId });

            this.publishers.delete(streamId);
            this.streamRooms.delete(streamId);
        });
    }

    private handleViewerLeave(viewerId: string, streamId: string): void {
        const room = this.streamRooms.get(streamId);
        if (room) {
            room.delete(viewerId);
            if (room.size === 0) {
                this.streamRooms.delete(streamId);
            }
        }

        // Notify publisher
        const publisherId = this.publishers.get(streamId);
        if (publisherId) {
            this.io.to(publisherId).emit('webrtc:viewer-left', {
                streamId,
                viewerId,
            });
        }
    }

    // ==========================================
    // RTMP Relay
    // ==========================================

    private handleRTMP(socket: Socket) {
        // Start RTMP relay
        socket.on('rtmp:start', (data: { streamId: string; url: string; streamKey: string }) => {
            const { streamId, url, streamKey } = data;
            console.log(`[RTMP] Starting relay for stream ${streamId} to ${url}`);

            const rtmpUrl = `${url}/${streamKey}`;
            const ffmpeg = this.startFFmpegRTMP(rtmpUrl, streamId);

            if (ffmpeg) {
                this.rtmpProcesses.set(streamId, ffmpeg);
                socket.emit('rtmp:started', { streamId });

                // Listen for encoded frames from the publisher
                socket.on('rtmp:frame', (frameData: { streamId: string; data: ArrayBuffer; type: 'video' | 'audio' }) => {
                    const process = this.rtmpProcesses.get(frameData.streamId);
                    if (process && process.stdin && !process.stdin.destroyed) {
                        const buffer = Buffer.from(frameData.data);
                        process.stdin.write(buffer);
                    }
                });
            } else {
                socket.emit('rtmp:error', { streamId, message: 'Failed to start FFmpeg RTMP relay' });
            }
        });

        // Stop RTMP relay
        socket.on('rtmp:stop', (data: { streamId: string }) => {
            const { streamId } = data;
            this.stopRTMP(streamId);
            socket.emit('rtmp:stopped', { streamId });
        });
    }

    private startFFmpegRTMP(rtmpUrl: string, streamId: string): ChildProcess | null {
        try {
            const ffmpeg = spawn('ffmpeg', [
                '-y',
                '-f', 'webm',
                '-i', 'pipe:0',
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-tune', 'zerolatency',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-f', 'flv',
                rtmpUrl,
            ], {
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            ffmpeg.stderr?.on('data', (data) => {
                const msg = data.toString();
                if (msg.includes('error') || msg.includes('Error')) {
                    console.error(`[RTMP FFmpeg] ${streamId}: ${msg}`);
                }
            });

            ffmpeg.on('close', (code) => {
                console.log(`[RTMP FFmpeg] Process for ${streamId} exited with code ${code}`);
                this.rtmpProcesses.delete(streamId);
            });

            ffmpeg.on('error', (err) => {
                console.error(`[RTMP FFmpeg] Failed to start for ${streamId}:`, err.message);
                this.rtmpProcesses.delete(streamId);
            });

            console.log(`[RTMP FFmpeg] Started for stream ${streamId} -> ${rtmpUrl}`);
            return ffmpeg;
        } catch (error) {
            console.error(`[RTMP FFmpeg] Exception starting:`, error);
            return null;
        }
    }

    private stopRTMP(streamId: string): void {
        const process = this.rtmpProcesses.get(streamId);
        if (process) {
            if (process.stdin && !process.stdin.destroyed) {
                process.stdin.end();
            }
            process.kill('SIGTERM');
            this.rtmpProcesses.delete(streamId);
            console.log(`[RTMP] Stopped relay for stream ${streamId}`);
        }
    }

    // ==========================================
    // HLS Segmenter
    // ==========================================

    private handleHLS(socket: Socket) {
        // Start HLS output
        socket.on('hls:start', (data: { streamId: string; segmentDuration?: number }) => {
            const { streamId, segmentDuration = 6 } = data;
            console.log(`[HLS] Starting segmenter for stream ${streamId}`);

            const streamDir = path.join(this.hlsOutputDir, streamId);
            if (!fs.existsSync(streamDir)) {
                fs.mkdirSync(streamDir, { recursive: true });
            }

            const playlistPath = path.join(streamDir, 'playlist.m3u8');
            const segmentPattern = path.join(streamDir, 'seg_%03d.ts');

            const ffmpeg = this.startFFmpegHLS(playlistPath, segmentPattern, segmentDuration, streamId);

            if (ffmpeg) {
                this.hlsProcesses.set(streamId, ffmpeg);
                socket.emit('hls:started', {
                    streamId,
                    manifestUrl: `/hls/${streamId}/playlist.m3u8`,
                });

                // Listen for encoded frames
                socket.on('hls:frame', (frameData: { streamId: string; data: ArrayBuffer; type: 'video' | 'audio' }) => {
                    const process = this.hlsProcesses.get(frameData.streamId);
                    if (process && process.stdin && !process.stdin.destroyed) {
                        const buffer = Buffer.from(frameData.data);
                        process.stdin.write(buffer);
                    }
                });
            } else {
                socket.emit('hls:error', { streamId, message: 'Failed to start FFmpeg HLS segmenter' });
            }
        });

        // Stop HLS output
        socket.on('hls:stop', (data: { streamId: string }) => {
            const { streamId } = data;
            this.stopHLS(streamId);
            socket.emit('hls:stopped', { streamId });
        });
    }

    private startFFmpegHLS(playlistPath: string, segmentPattern: string, segmentDuration: number, streamId: string): ChildProcess | null {
        try {
            const ffmpeg = spawn('ffmpeg', [
                '-y',
                '-f', 'webm',
                '-i', 'pipe:0',
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-tune', 'zerolatency',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-f', 'hls',
                '-hls_time', String(segmentDuration),
                '-hls_list_size', '10',
                '-hls_flags', 'delete_segments+append_list',
                '-hls_segment_filename', segmentPattern,
                playlistPath,
            ], {
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            ffmpeg.stderr?.on('data', (data) => {
                const msg = data.toString();
                if (msg.includes('error') || msg.includes('Error')) {
                    console.error(`[HLS FFmpeg] ${streamId}: ${msg}`);
                }
            });

            ffmpeg.on('close', (code) => {
                console.log(`[HLS FFmpeg] Process for ${streamId} exited with code ${code}`);
                this.hlsProcesses.delete(streamId);
            });

            ffmpeg.on('error', (err) => {
                console.error(`[HLS FFmpeg] Failed to start for ${streamId}:`, err.message);
                this.hlsProcesses.delete(streamId);
            });

            console.log(`[HLS FFmpeg] Started for stream ${streamId} -> ${playlistPath}`);
            return ffmpeg;
        } catch (error) {
            console.error(`[HLS FFmpeg] Exception starting:`, error);
            return null;
        }
    }

    private stopHLS(streamId: string): void {
        const process = this.hlsProcesses.get(streamId);
        if (process) {
            if (process.stdin && !process.stdin.destroyed) {
                process.stdin.end();
            }
            process.kill('SIGTERM');
            this.hlsProcesses.delete(streamId);
            console.log(`[HLS] Stopped segmenter for stream ${streamId}`);
        }
    }

    // ==========================================
    // Cleanup
    // ==========================================

    private cleanupSocket(socketId: string): void {
        // Clean up viewer from all streams
        this.streamRooms.forEach((viewers, streamId) => {
            if (viewers.has(socketId)) {
                this.handleViewerLeave(socketId, streamId);
            }
        });

        // Clean up publisher streams
        this.publishers.forEach((publisherId, streamId) => {
            if (publisherId === socketId) {
                this.stopRTMP(streamId);
                this.stopHLS(streamId);
                this.publishers.delete(streamId);
                this.streamRooms.delete(streamId);
            }
        });
    }
}
