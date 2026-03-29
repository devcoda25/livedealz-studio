/**
 * Stream Output - Handles WebRTC, RTMP, and HLS delivery
 * 
 * WebRTC: Full signaling via Socket.IO (offer/answer/ICE exchange)
 * RTMP: Sends encoded frames to server, server relays to FFmpeg -> RTMP ingest
 * HLS: Sends encoded frames to server, server runs FFmpeg HLS segmenter
 */

import {
  StreamConfig,
  StreamProtocol,
  RTMPPublisher,
  WebRTCPublisher,
  HLSSegmenter,
  StreamState,
} from './types';

import { Socket } from 'socket.io-client';

interface RTMPConfig {
  url: string;
  streamKey: string;
}

interface WebRTCConfig {
  streamId: string;
  iceServers?: RTCIceServer[];
  socket?: Socket;
}

interface HLSConfig {
  segmentDuration?: number;
  socket?: Socket;
  streamId?: string;
}

type OutputEventCallback = (event: { type: string; data?: unknown }) => void;

export class StreamOutput {
  private config: StreamConfig;
  private protocol: StreamProtocol;
  private state: StreamState = 'idle';

  // Publishers
  private rtmpPublisher: RTMPPublisher | null = null;
  private webrtcPublisher: WebRTCPublisher | null = null;
  private hlsSegmenter: HLSSegmenter | null = null;

  // WebRTC specific
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;

  // Socket.IO for signaling
  private socket: Socket | null = null;
  private streamId: string | null = null;

  // RTMP/HLS binary frame buffer
  private frameBuffer: { data: ArrayBuffer; type: 'video' | 'audio'; timestamp: number }[] = [];
  private frameSendInterval: ReturnType<typeof setInterval> | null = null;

  // Callbacks
  private onEvent: OutputEventCallback | null = null;
  private onStateChange: ((state: StreamState) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;

  constructor(config: StreamConfig) {
    this.config = config;
    this.protocol = config.protocol;
  }

  /**
   * Set event callback
   */
  on(eventType: string, callback: OutputEventCallback): void {
    this.onEvent = callback;
  }

  /**
   * Set state change callback
   */
  onState(callback: (state: StreamState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Set error callback
   */
  onErrorCallback(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Set the Socket.IO instance for signaling
   */
  setSocket(socket: Socket): void {
    this.socket = socket;
    this.setupSocketListeners();
  }

  // ==========================================
  // WebRTC
  // ==========================================

  /**
   * Start WebRTC output with real Socket.IO signaling
   */
  async startWebRTC(config: WebRTCConfig): Promise<boolean> {
    if (this.state === 'live') {
      console.warn('Already streaming');
      return false;
    }

    this.setState('connecting');
    this.streamId = config.streamId;

    if (config.socket) {
      this.setSocket(config.socket);
    }

    try {
      const iceServers = config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ];

      this.peerConnection = new RTCPeerConnection({ iceServers });

      // Handle ICE connection state
      this.peerConnection.oniceconnectionstatechange = () => {
        const iceState = this.peerConnection?.iceConnectionState;
        console.log('[WebRTC] ICE state:', iceState);

        if (iceState === 'connected' || iceState === 'completed') {
          this.setState('live');
        } else if (iceState === 'disconnected') {
          this.setState('reconnecting');
        } else if (iceState === 'failed') {
          this.setState('reconnecting');
          this.attemptReconnect();
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const connState = this.peerConnection?.connectionState;
        console.log('[WebRTC] Connection state:', connState);
        if (connState === 'connected') {
          this.setState('live');
        } else if (connState === 'failed' || connState === 'disconnected') {
          this.emit('connection:degraded', { state: connState });
        }
      };

      // Handle ICE candidates - send to server for relay
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.socket && this.streamId) {
          this.socket.emit('webrtc:ice-candidate', {
            streamId: this.streamId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Create data channel for metadata
      this.dataChannel = this.peerConnection.createDataChannel('metadata', {
        ordered: true,
      });

      this.dataChannel.onopen = () => {
        console.log('[WebRTC] Data channel open');
        this.emit('data:channel:open', {});
      };

      this.dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('data:received', data);
        } catch (e) {
          // Binary data, ignore
        }
      };

      // Add local tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Create offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await this.peerConnection.setLocalDescription(offer);

      // Notify server we're starting a publish stream
      if (this.socket) {
        this.socket.emit('webrtc:publish-start', { streamId: this.streamId });

        // Send offer to server for relay to viewers
        this.socket.emit('webrtc:offer', {
          streamId: this.streamId,
          sdp: offer,
        });
      }

      this.webrtcPublisher = {
        peerConnection: this.peerConnection,
        connectionState: this.peerConnection.connectionState,
        tracks: this.localStream?.getTracks() || [],
      };

      console.log('[WebRTC] Publishing started for stream:', this.streamId);
      return true;
    } catch (error) {
      console.error('Failed to start WebRTC:', error);
      this.setState('error');
      this.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Handle an answer from a viewer
   */
  async handleAnswer(viewerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log('[WebRTC] Remote description set from viewer:', viewerId);
    } catch (error) {
      console.error('[WebRTC] Failed to set remote description:', error);
    }
  }

  /**
   * Handle an ICE candidate from a viewer
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit, fromId: string): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('[WebRTC] Failed to add ICE candidate:', error);
    }
  }

  // ==========================================
  // RTMP
  // ==========================================

  /**
   * Start RTMP output - sends encoded frames to server for FFmpeg relay
   */
  async startRTMP(config: RTMPConfig): Promise<boolean> {
    if (this.state === 'live') {
      console.warn('Already streaming');
      return false;
    }

    this.setState('connecting');

    try {
      // Start RTMP relay on server
      if (this.socket && this.streamId) {
        this.socket.emit('rtmp:start', {
          streamId: this.streamId,
          url: config.url,
          streamKey: config.streamKey,
        });

        // Wait for server confirmation
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('RTMP start timeout')), 10000);

          const onStarted = (data: { streamId: string }) => {
            if (data.streamId === this.streamId) {
              clearTimeout(timeout);
              this.socket!.off('rtmp:started', onStarted);
              this.socket!.off('rtmp:error', onError);
              resolve();
            }
          };

          const onError = (data: { streamId: string; message: string }) => {
            if (data.streamId === this.streamId) {
              clearTimeout(timeout);
              this.socket!.off('rtmp:started', onStarted);
              this.socket!.off('rtmp:error', onError);
              reject(new Error(data.message));
            }
          };

          this.socket!.on('rtmp:started', onStarted);
          this.socket!.on('rtmp:error', onError);
        });
      }

      this.rtmpPublisher = {
        url: config.url,
        streamKey: config.streamKey,
        connected: true,
        bytesSent: 0,
      };

      this.setState('live');
      console.log('[RTMP] Started relay to:', config.url);
      return true;
    } catch (error) {
      console.error('Failed to start RTMP:', error);
      this.setState('error');
      this.onError?.(error as Error);
      return false;
    }
  }

  // ==========================================
  // HLS
  // ==========================================

  /**
   * Start HLS output - sends encoded frames to server for FFmpeg HLS segmenter
   */
  async startHLS(config: HLSConfig): Promise<boolean> {
    if (this.state === 'live') {
      console.warn('Already streaming');
      return false;
    }

    this.setState('connecting');

    try {
      const streamId = config.streamId || this.streamId || `hls-${Date.now()}`;
      this.streamId = streamId;

      if (config.socket) {
        this.setSocket(config.socket);
      }

      if (this.socket) {
        this.socket.emit('hls:start', {
          streamId,
          segmentDuration: config.segmentDuration || 6,
        });

        // Wait for server confirmation
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('HLS start timeout')), 10000);

          const onStarted = (data: { streamId: string; manifestUrl: string }) => {
            if (data.streamId === streamId) {
              clearTimeout(timeout);
              this.socket!.off('hls:started', onStarted);
              this.socket!.off('hls:error', onError);

              if (this.hlsSegmenter) {
                this.hlsSegmenter.manifestUrl = data.manifestUrl;
              }
              resolve();
            }
          };

          const onError = (data: { streamId: string; message: string }) => {
            if (data.streamId === streamId) {
              clearTimeout(timeout);
              this.socket!.off('hls:started', onStarted);
              this.socket!.off('hls:error', onError);
              reject(new Error(data.message));
            }
          };

          this.socket!.on('hls:started', onStarted);
          this.socket!.on('hls:error', onError);
        });
      }

      this.hlsSegmenter = {
        manifestUrl: '',
        segmentDuration: config.segmentDuration || 6,
        segmentsGenerated: 0,
        latestLatency: 0,
      };

      this.setState('live');
      console.log('[HLS] Started segmenter for stream:', streamId);
      return true;
    } catch (error) {
      console.error('Failed to start HLS:', error);
      this.setState('error');
      this.onError?.(error as Error);
      return false;
    }
  }

  // ==========================================
  // Shared methods
  // ==========================================

  /**
   * Set local stream to publish
   */
  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;

    if (this.peerConnection) {
      // Remove existing senders first
      this.peerConnection.getSenders().forEach(sender => {
        if (sender.track) {
          this.peerConnection!.removeTrack(sender);
        }
      });

      stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, stream);
      });
    }
  }

  /**
   * Send video frame data
   * Routes to the appropriate protocol handler
   */
  sendVideoFrame(data: ArrayBuffer, timestamp: number, isKeyFrame: boolean): void {
    if (this.state !== 'live') return;

    if (this.protocol === 'rtmp' && this.socket && this.streamId) {
      this.socket.emit('rtmp:frame', {
        streamId: this.streamId,
        data,
        type: 'video',
      });
      if (this.rtmpPublisher) {
        this.rtmpPublisher.bytesSent += data.byteLength;
      }
    }

    if (this.protocol === 'hls' && this.socket && this.streamId) {
      this.socket.emit('hls:frame', {
        streamId: this.streamId,
        data,
        type: 'video',
      });
      if (this.hlsSegmenter) {
        this.hlsSegmenter.segmentsGenerated++;
      }
    }

    // WebRTC sends via peer connection directly (tracks are already attached)
  }

  /**
   * Send audio frame data
   */
  sendAudioFrame(data: ArrayBuffer, timestamp: number): void {
    if (this.state !== 'live') return;

    if (this.protocol === 'rtmp' && this.socket && this.streamId) {
      this.socket.emit('rtmp:frame', {
        streamId: this.streamId,
        data,
        type: 'audio',
      });
    }

    if (this.protocol === 'hls' && this.socket && this.streamId) {
      this.socket.emit('hls:frame', {
        streamId: this.streamId,
        data,
        type: 'audio',
      });
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    console.log('[WebRTC] Attempting to reconnect...');

    setTimeout(async () => {
      if (!this.peerConnection) return;

      const state = this.peerConnection.iceConnectionState;
      if (state === 'failed' || state === 'disconnected') {
        try {
          // Restart ICE negotiation
          const offer = await this.peerConnection.createOffer({ iceRestart: true });
          await this.peerConnection.setLocalDescription(offer);

          if (this.socket && this.streamId) {
            this.socket.emit('webrtc:offer', {
              streamId: this.streamId,
              sdp: offer,
            });
          }

          console.log('[WebRTC] ICE restart initiated');
        } catch (error) {
          console.error('[WebRTC] Reconnect failed:', error);
          this.setState('error');
        }
      }
    }, 2000);
  }

  /**
   * Setup Socket.IO event listeners for signaling
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Viewer sends answer
    this.socket.on('webrtc:answer', async (data: { streamId: string; sdp: RTCSessionDescriptionInit; viewerId: string }) => {
      if (data.streamId === this.streamId) {
        console.log('[WebRTC] Received answer from viewer:', data.viewerId);
        await this.handleAnswer(data.viewerId, data.sdp);
      }
    });

    // ICE candidate from viewer
    this.socket.on('webrtc:ice-candidate', async (data: { streamId: string; candidate: RTCIceCandidateInit; fromId: string }) => {
      if (data.streamId === this.streamId) {
        await this.handleIceCandidate(data.candidate, data.fromId);
      }
    });

    // Viewer joined
    this.socket.on('webrtc:viewer-joined', (data: { streamId: string; viewerId: string }) => {
      if (data.streamId === this.streamId) {
        console.log('[WebRTC] Viewer joined:', data.viewerId);
        this.emit('viewer:joined', { viewerId: data.viewerId });
      }
    });

    // Viewer left
    this.socket.on('webrtc:viewer-left', (data: { streamId: string; viewerId: string }) => {
      if (data.streamId === this.streamId) {
        console.log('[WebRTC] Viewer left:', data.viewerId);
        this.emit('viewer:left', { viewerId: data.viewerId });
      }
    });
  }

  /**
   * Stop streaming
   */
  async stop(): Promise<void> {
    // Stop frame sending interval
    if (this.frameSendInterval) {
      clearInterval(this.frameSendInterval);
      this.frameSendInterval = null;
    }
    this.frameBuffer = [];

    // Close WebRTC
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.dataChannel = null;

    // Notify server
    if (this.socket && this.streamId) {
      if (this.protocol === 'webrtc') {
        this.socket.emit('webrtc:publish-stop', { streamId: this.streamId });
      }
      if (this.protocol === 'rtmp') {
        this.socket.emit('rtmp:stop', { streamId: this.streamId });
      }
      if (this.protocol === 'hls') {
        this.socket.emit('hls:stop', { streamId: this.streamId });
      }

      // Remove listeners
      this.socket.off('webrtc:answer');
      this.socket.off('webrtc:ice-candidate');
      this.socket.off('webrtc:viewer-joined');
      this.socket.off('webrtc:viewer-left');
    }

    this.rtmpPublisher = null;
    this.webrtcPublisher = null;
    this.hlsSegmenter = null;
    this.localStream = null;
    this.streamId = null;

    this.setState('stopped');
  }

  /**
   * Get current state
   */
  getState(): StreamState {
    return this.state;
  }

  /**
   * Get output stats
   */
  getStats() {
    return {
      state: this.state,
      protocol: this.protocol,
      streamId: this.streamId,
      rtmp: this.rtmpPublisher ? {
        connected: this.rtmpPublisher.connected,
        bytesSent: this.rtmpPublisher.bytesSent,
      } : null,
      webrtc: this.webrtcPublisher ? {
        connectionState: this.webrtcPublisher.connectionState,
        tracksCount: this.webrtcPublisher.tracks.length,
        iceState: this.peerConnection?.iceConnectionState || 'unknown',
      } : null,
      hls: this.hlsSegmenter ? {
        manifestUrl: this.hlsSegmenter.manifestUrl,
        segmentsGenerated: this.hlsSegmenter.segmentsGenerated,
        latestLatency: this.hlsSegmenter.latestLatency,
      } : null,
    };
  }

  /**
   * Set output state
   */
  private setState(state: StreamState): void {
    this.state = state;
    this.onStateChange?.(state);
    this.emit('state:changed', { state });
  }

  /**
   * Emit event
   */
  private emit(type: string, data?: unknown): void {
    this.onEvent?.({ type, data });
  }
}

/**
 * WebRTC Viewer - Handles viewing WebRTC streams with real signaling
 */
export class WebRTCViewer {
  private peerConnection: RTCPeerConnection | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: Socket | null = null;
  private streamId: string | null = null;

  private onTrack: ((stream: MediaStream) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;

  /**
   * Set the Socket.IO instance for signaling
   */
  setSocket(socket: Socket): void {
    this.socket = socket;
  }

  /**
   * Connect to a WebRTC stream with real signaling
   */
  async connect(
    signalingUrl: string,
    streamId: string,
    iceServers?: RTCIceServer[]
  ): Promise<MediaStream | null> {
    if (!this.socket) {
      console.error('[WebRTC Viewer] No socket available for signaling');
      return null;
    }

    this.streamId = streamId;

    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: iceServers || [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      });

      // Handle incoming tracks
      this.peerConnection.ontrack = (event) => {
        console.log('[WebRTC Viewer] Received track:', event.track.kind);
        this.remoteStream = event.streams[0];
        this.onTrack?.(this.remoteStream);
      };

      // Handle ICE candidates - send to server
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.socket && this.streamId) {
          this.socket.emit('webrtc:ice-candidate', {
            streamId: this.streamId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Listen for offers from publisher
      this.socket.on('webrtc:offer', async (data: { streamId: string; sdp: RTCSessionDescriptionInit; publisherId: string }) => {
        if (data.streamId !== this.streamId || !this.peerConnection) return;

        try {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);

          // Send answer back to publisher via server
          this.socket!.emit('webrtc:answer', {
            streamId: this.streamId!,
            sdp: answer,
            publisherId: data.publisherId,
          });

          console.log('[WebRTC Viewer] Sent answer to publisher');
        } catch (error) {
          console.error('[WebRTC Viewer] Failed to handle offer:', error);
        }
      });

      // Listen for ICE candidates from publisher
      this.socket.on('webrtc:ice-candidate', async (data: { streamId: string; candidate: RTCIceCandidateInit; fromId: string }) => {
        if (data.streamId !== this.streamId || !this.peerConnection) return;

        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('[WebRTC Viewer] Failed to add ICE candidate:', error);
        }
      });

      // Listen for stream ended
      this.socket.on('webrtc:stream-ended', (data: { streamId: string }) => {
        if (data.streamId === this.streamId) {
          console.log('[WebRTC Viewer] Stream ended');
          this.disconnect();
        }
      });

      // Join the stream room
      this.socket.emit('webrtc:join-stream', { streamId });

      // Wait for confirmation
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Join stream timeout')), 10000);

        this.socket!.once('webrtc:stream-joined', (data: { streamId: string; publisherId: string | null }) => {
          if (data.streamId === streamId) {
            clearTimeout(timeout);
            console.log('[WebRTC Viewer] Joined stream, publisher:', data.publisherId);
            resolve();
          }
        });
      });

      return this.remoteStream;
    } catch (error) {
      console.error('Failed to connect to WebRTC stream:', error);
      this.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Disconnect from stream
   */
  disconnect(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.socket && this.streamId) {
      this.socket.emit('webrtc:leave-stream', { streamId: this.streamId });
      this.socket.off('webrtc:offer');
      this.socket.off('webrtc:ice-candidate');
      this.socket.off('webrtc:stream-ended');
    }

    this.remoteStream = null;
    this.streamId = null;
  }

  /**
   * Set track callback
   */
  onTrackCallback(callback: (stream: MediaStream) => void): void {
    this.onTrack = callback;
  }

  /**
   * Set error callback
   */
  onErrorCallback(callback: (error: Error) => void): void {
    this.onError = callback;
  }
}
