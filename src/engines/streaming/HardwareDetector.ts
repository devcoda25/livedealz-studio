/**
 * Hardware Acceleration Detector
 * 
 * Detects available hardware acceleration capabilities for video encoding
 * Supports NVENC (NVIDIA), AMD VCE/AMF, Intel QuickSync, VideoToolbox (macOS), and VAAPI (Linux)
 */

import { HardwareAccelType, HardwareCapability, StreamResolution } from './types';

export interface DetectedHardware {
  type: HardwareAccelType;
  name: string;
  vendor: string;
  capabilities: HardwareCapability;
}

export class HardwareDetector {
  private static detectedHardware: DetectedHardware | null = null;

  /**
   * Detect available hardware acceleration
   */
  static async detect(): Promise<DetectedHardware | null> {
    if (this.detectedHardware) {
      return this.detectedHardware;
    }

    // Check for VideoToolbox (macOS)
    if (this.isMacOS()) {
      const capability = await this.detectVideoToolbox();
      if (capability) {
        this.detectedHardware = {
          type: 'videotoolbox',
          name: 'Apple VideoToolbox',
          vendor: 'Apple',
          capabilities: capability,
        };
        return this.detectedHardware;
      }
    }

    // Check for NVENC (NVIDIA)
    const nvenc = await this.detectNVENC();
    if (nvenc) {
      this.detectedHardware = nvenc;
      return this.detectedHardware;
    }

    // Check for AMD VCE/AMF
    const amf = await this.detectAMF();
    if (amf) {
      this.detectedHardware = amf;
      return this.detectedHardware;
    }

    // Check for VAAPI (Linux)
    const vaapi = await this.detectVAAPI();
    if (vaapi) {
      this.detectedHardware = vaapi;
      return this.detectedHardware;
    }

    // Check for QuickSync (Intel)
    const quicksync = await this.detectQuickSync();
    if (quicksync) {
      this.detectedHardware = quicksync;
      return this.detectedHardware;
    }

    // Default to software
    this.detectedHardware = {
      type: 'software',
      name: 'Software Encoder',
      vendor: 'N/A',
      capabilities: this.getSoftwareCapabilities(),
    };

    return this.detectedHardware;
  }

  /**
   * Get recommended hardware acceleration type
   */
  static getRecommendedType(): HardwareAccelType {
    const hardware = this.detectSync();
    return hardware?.type || 'software';
  }

  /**
   * Synchronous detection (limited)
   */
  private static detectSync(): DetectedHardware | null {
    if (this.isMacOS()) {
      return {
        type: 'videotoolbox',
        name: 'Apple VideoToolbox',
        vendor: 'Apple',
        capabilities: this.getVideoToolboxCapabilitiesSync(),
      };
    }
    return null;
  }

  private static isMacOS(): boolean {
    return typeof navigator !== 'undefined' && 
           /Mac/.test(navigator.platform);
  }

  private static async detectNVENC(): Promise<DetectedHardware | null> {
    // NVIDIA NVENC detection - requires testing WebCodecs support
    // WebCodecs doesn't directly expose hardware type, but we can infer from browser
    
    if (typeof navigator === 'undefined') return null;
    
    const isNVIDIA = /NVIDIA|NVidia/i.test(navigator.userAgent);
    if (!isNVIDIA) return null;

    // Test if H.264 High profile is supported (usually indicates hardware)
    try {
      const support = await globalThis.VideoEncoder.isConfigSupported({
        codec: 'avc1.64001f',  // High profile
        // @ts-ignore - WebCodecs types
        width: { min: 320, max: 1920 },
        // @ts-ignore
        height: { min: 240, max: 1080 },
        // @ts-ignore
        bitrate: { min: 100000, max: 8000000 },
        // @ts-ignore
        framerate: { min: 1, max: 60 },
      });

      if (support.supported) {
        return {
          type: 'nvenc',
          name: 'NVIDIA NVENC',
          vendor: 'NVIDIA',
          capabilities: {
            type: 'nvenc',
            name: 'NVIDIA NVENC',
            vendor: 'NVIDIA',
            supportsH264: true,
            supportsH265: true,
            supportsVP9: false,
            supports8K: true,
            maxResolutions: [
              { width: 3840, height: 2160 },
              { width: 1920, height: 1080 },
            ],
            maxBitrate: 50000,  // kbps
            maxFramerate: 60,
            supportsBFrames: true,
            supportsCBR: true,
            supportsVBR: true,
          },
        };
      }
    } catch (e) {
      console.warn('NVENC detection failed:', e);
    }

    return null;
  }

  private static async detectAMF(): Promise<DetectedHardware | null> {
    // AMD VCE/AMF detection
    if (typeof navigator === 'undefined') return null;
    
    const isAMD = /AMD|Radeon/i.test(navigator.userAgent);
    if (!isAMD) return null;

    try {
      const support = await globalThis.VideoEncoder.isConfigSupported({
        codec: 'avc1.64001f',
        // @ts-ignore
        width: { min: 320, max: 1920 },
        // @ts-ignore
        height: { min: 240, max: 1080 },
        // @ts-ignore
        bitrate: { min: 100000, max: 8000000 },
        // @ts-ignore
        framerate: { min: 1, max: 60 },
      });

      if (support.supported) {
        return {
          type: 'amf',
          name: 'AMD VCE',
          vendor: 'AMD',
          capabilities: {
            type: 'amf',
            name: 'AMD VCE',
            vendor: 'AMD',
            supportsH264: true,
            supportsH265: false,
            supportsVP9: false,
            supports8K: false,
            maxResolutions: [
              { width: 1920, height: 1080 },
            ],
            maxBitrate: 20000,
            maxFramerate: 60,
            supportsBFrames: false,
            supportsCBR: true,
            supportsVBR: true,
          },
        };
      }
    } catch (e) {
      console.warn('AMD detection failed:', e);
    }

    return null;
  }

  private static async detectVAAPI(): Promise<DetectedHardware | null> {
    // VAAPI detection - mostly Linux
    if (typeof navigator === 'undefined') return null;
    
    const isLinux = /Linux/i.test(navigator.userAgent);
    if (!isLinux) return null;

    // VAAPI is difficult to detect in browser, assume software for now
    return null;
  }

  private static async detectQuickSync(): Promise<DetectedHardware | null> {
    // Intel QuickSync detection
    if (typeof navigator === 'undefined') return null;
    
    const isIntel = /Intel|i[3456]/.test(navigator.userAgent);
    if (!isIntel) return null;

    try {
      const support = await globalThis.VideoEncoder.isConfigSupported({
        codec: 'avc1.64001f',
        // @ts-ignore
        width: { min: 320, max: 1920 },
        // @ts-ignore
        height: { min: 240, max: 1080 },
        // @ts-ignore
        bitrate: { min: 100000, max: 8000000 },
        // @ts-ignore
        framerate: { min: 1, max: 60 },
      });

      if (support.supported) {
        return {
          type: 'nvenc',  // Reuse nvenc type as it's similar
          name: 'Intel QuickSync',
          vendor: 'Intel',
          capabilities: {
            type: 'nvenc',
            name: 'Intel QuickSync',
            vendor: 'Intel',
            supportsH264: true,
            supportsH265: true,
            supportsVP9: false,
            supports8K: false,
            maxResolutions: [
              { width: 1920, height: 1080 },
              { width: 1280, height: 720 },
            ],
            maxBitrate: 20000,
            maxFramerate: 60,
            supportsBFrames: true,
            supportsCBR: true,
            supportsVBR: true,
          },
        };
      }
    } catch (e) {
      console.warn('QuickSync detection failed:', e);
    }

    return null;
  }

  private static async detectVideoToolbox(): Promise<HardwareCapability | null> {
    // VideoToolbox - macOS hardware encoder
    try {
      const support = await globalThis.VideoEncoder.isConfigSupported({
        codec: 'avc1.64001f',
        // @ts-ignore
        width: { min: 320, max: 3840 },
        // @ts-ignore
        height: { min: 240, max: 2160 },
        // @ts-ignore
        bitrate: { min: 100000, max: 50000000 },
        // @ts-ignore
        framerate: { min: 1, max: 120 },
      });

      if (support.supported) {
        return this.getVideoToolboxCapabilitiesSync();
      }
    } catch (e) {
      console.warn('VideoToolbox detection failed:', e);
    }

    return null;
  }

  private static getVideoToolboxCapabilitiesSync(): HardwareCapability {
    return {
      type: 'videotoolbox',
      name: 'Apple VideoToolbox',
      vendor: 'Apple',
      supportsH264: true,
      supportsH265: true,
      supportsVP9: true,
      supports8K: true,
      maxResolutions: [
        { width: 3840, height: 2160 },
        { width: 1920, height: 1080 },
      ],
      maxBitrate: 100000,  // Very high for Apple Silicon
      maxFramerate: 120,
      supportsBFrames: false,
      supportsCBR: true,
      supportsVBR: true,
    };
  }

  private static getSoftwareCapabilities(): HardwareCapability {
    return {
      type: 'software',
      name: 'Software Encoder',
      vendor: 'N/A',
      supportsH264: true,
      supportsH265: true,
      supportsVP9: true,
      supports8K: false,
      maxResolutions: [
        { width: 1920, height: 1080 },
        { width: 1280, height: 720 },
      ],
      maxBitrate: 10000,
      maxFramerate: 30,
      supportsBFrames: false,
      supportsCBR: true,
      supportsVBR: true,
    };
  }

  /**
   * Get codec preference for hardware
   */
  static getPreferredCodec(hardwareType: HardwareAccelType): { video: 'h264' | 'h265', audio: 'aac' | 'opus' } {
    switch (hardwareType) {
      case 'nvenc':
        return { video: 'h264', audio: 'aac' };
      case 'amf':
        return { video: 'h264', audio: 'aac' };
      case 'videotoolbox':
        return { video: 'h264', audio: 'aac' };
      case 'vaapi':
        return { video: 'h264', audio: 'aac' };
      default:
        return { video: 'h264', audio: 'opus' };
    }
  }

  /**
   * Reset detection (for testing)
   */
  static reset(): void {
    this.detectedHardware = null;
  }
}
