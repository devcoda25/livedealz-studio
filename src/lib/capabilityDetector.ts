/**
 * Device Capability Detector
 * 
 * Auto-detects camera max resolution, encoder support, network bandwidth,
 * and returns the optimal StreamQuality preset for the user's device.
 */

import { StreamQuality, StreamResolution, DEFAULT_STREAM_CONFIGS } from '@/engines/streaming/types';

export interface DeviceCapabilities {
  cameraMaxResolution: StreamResolution;
  cameraMaxFramerate: number;
  encoderSupports1080p60: boolean;
  encoderSupports1080p30: boolean;
  encoderSupports720p30: boolean;
  networkBandwidthKbps: number;
  recommendedQuality: StreamQuality;
  detectedCameraDeviceId?: string;
}

const RESOLUTIONS_TO_PROBE: StreamResolution[] = [
  { width: 3840, height: 2160 },
  { width: 2560, height: 1440 },
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 854, height: 480 },
];

const FRAMERATES_TO_PROBE = [60, 30, 24];

let cachedCapabilities: DeviceCapabilities | null = null;

/**
 * Detect all device capabilities and return optimal quality preset.
 * Results are cached after first detection.
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  const [cameraMaxResolution, cameraMaxFramerate, encoderCapabilities, networkBandwidthKbps] = await Promise.all([
    detectCameraMaxResolution(),
    detectCameraMaxFramerate(),
    detectEncoderCapabilities(),
    estimateNetworkBandwidth(),
  ]);

  const recommendedQuality = computeOptimalQuality(
    cameraMaxResolution,
    cameraMaxFramerate,
    encoderCapabilities,
    networkBandwidthKbps
  );

  cachedCapabilities = {
    cameraMaxResolution,
    cameraMaxFramerate,
    encoderSupports1080p60: encoderCapabilities.supports1080p60,
    encoderSupports1080p30: encoderCapabilities.supports1080p30,
    encoderSupports720p30: encoderCapabilities.supports720p30,
    networkBandwidthKbps,
    recommendedQuality,
  };

  console.log('[CapabilityDetector] Detected capabilities:', cachedCapabilities);
  return cachedCapabilities;
}

/**
 * Get just the recommended quality without full detection (faster).
 * Uses cached results if available.
 */
export async function getRecommendedQuality(): Promise<StreamQuality> {
  const caps = await detectDeviceCapabilities();
  return caps.recommendedQuality;
}

/**
 * Get optimal camera constraints for getUserMedia based on detected capabilities.
 */
export async function getOptimalCameraConstraints(
  deviceId?: string
): Promise<MediaStreamConstraints> {
  const caps = await detectDeviceCapabilities();
  const quality = caps.recommendedQuality;
  const config = DEFAULT_STREAM_CONFIGS[quality];

  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: caps.cameraMaxResolution.width },
    height: { ideal: caps.cameraMaxResolution.height },
    frameRate: { ideal: Math.min(caps.cameraMaxFramerate, config.framerate) },
  };

  if (deviceId) {
    videoConstraints.deviceId = { exact: deviceId };
  }

  return {
    video: videoConstraints,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  };
}

/**
 * Clear cached capabilities (e.g., when camera device changes)
 */
export function clearCapabilitiesCache(): void {
  cachedCapabilities = null;
}

// ==========================================
// Internal Detection Methods
// ==========================================

/**
 * Probe camera for max supported resolution by trying high-to-low.
 */
async function detectCameraMaxResolution(): Promise<StreamResolution> {
  for (const resolution of RESOLUTIONS_TO_PROBE) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: resolution.width },
          height: { ideal: resolution.height },
        },
        audio: false,
      });

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      stream.getTracks().forEach(t => t.stop());

      const actualWidth = settings.width || resolution.width;
      const actualHeight = settings.height || resolution.height;

      // If we got at least 90% of the requested resolution, consider it supported
      if (actualWidth >= resolution.width * 0.9 && actualHeight >= resolution.height * 0.9) {
        console.log(`[CapabilityDetector] Camera supports: ${actualWidth}x${actualHeight}`);
        return { width: actualWidth, height: actualHeight };
      }
    } catch {
      // This resolution not supported, try next lower
      continue;
    }
  }

  // Fallback to 720p
  return { width: 1280, height: 720 };
}

/**
 * Probe camera for max supported framerate.
 */
async function detectCameraMaxFramerate(): Promise<number> {
  for (const fps of FRAMERATES_TO_PROBE) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { frameRate: { ideal: fps } },
        audio: false,
      });

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      stream.getTracks().forEach(t => t.stop());

      const actualFps = settings.frameRate || 30;
      if (actualFps >= fps * 0.85) {
        console.log(`[CapabilityDetector] Camera supports ${Math.round(actualFps)}fps`);
        return Math.round(actualFps);
      }
    } catch {
      continue;
    }
  }

  return 30;
}

/**
 * Detect WebCodecs encoder support for various resolutions/framerates.
 */
async function detectEncoderCapabilities(): Promise<{
  supports1080p60: boolean;
  supports1080p30: boolean;
  supports720p30: boolean;
}> {
  const result = { supports1080p60: false, supports1080p30: false, supports720p30: false };

  if (typeof VideoEncoder === 'undefined' && typeof globalThis.VideoEncoder === 'undefined') {
    // No WebCodecs support - assume basic capabilities
    result.supports720p30 = true;
    return result;
  }

  const VideoEncoderClass = typeof VideoEncoder !== 'undefined' ? VideoEncoder : globalThis.VideoEncoder;

  // Test 1080p60
  try {
    const support = await VideoEncoderClass.isConfigSupported({
      codec: 'avc1.64001f',
      width: 1920,
      height: 1080,
      bitrate: 8000000,
      framerate: 60,
    } as any);
    result.supports1080p60 = support.supported === true;
  } catch {}

  // Test 1080p30
  try {
    const support = await VideoEncoderClass.isConfigSupported({
      codec: 'avc1.64001f',
      width: 1920,
      height: 1080,
      bitrate: 4500000,
      framerate: 30,
    } as any);
    result.supports1080p30 = support.supported === true;
  } catch {}

  // Test 720p30
  try {
    const support = await VideoEncoderClass.isConfigSupported({
      codec: 'avc1.4d001f',
      width: 1280,
      height: 720,
      bitrate: 2000000,
      framerate: 30,
    } as any);
    result.supports720p30 = support.supported === true;
  } catch {}

  // If nothing worked, assume at least 720p30
  if (!result.supports1080p60 && !result.supports1080p30 && !result.supports720p30) {
    result.supports720p30 = true;
  }

  console.log('[CapabilityDetector] Encoder support:', result);
  return result;
}

/**
 * Estimate available network bandwidth using a small resource fetch.
 */
async function estimateNetworkBandwidth(): Promise<number> {
  // Use Network Information API if available
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn) {
      const downlink = conn.downlink; // Mbps
      if (downlink && downlink > 0) {
        const bandwidthKbps = Math.round(downlink * 1000);
        console.log(`[CapabilityDetector] Network downlink: ${downlink}Mbps (${bandwidthKbps}kbps)`);
        return bandwidthKbps;
      }
    }
  }

  // Fallback: assume decent bandwidth
  return 10000; // 10 Mbps
}

/**
 * Compute optimal quality based on all detected capabilities.
 */
function computeOptimalQuality(
  cameraResolution: StreamResolution,
  cameraFramerate: number,
  encoderCaps: { supports1080p60: boolean; supports1080p30: boolean; supports720p30: boolean },
  networkBandwidthKbps: number
): StreamQuality {
  const canDo1080p = cameraResolution.width >= 1920 && cameraResolution.height >= 1080;
  const canDo60fps = cameraFramerate >= 55;

  // Ultra: 1080p60 requires camera 1080p+, 60fps, encoder support, and 10+ Mbps
  if (canDo1080p && canDo60fps && encoderCaps.supports1080p60 && networkBandwidthKbps >= 8000) {
    return 'ultra';
  }

  // High: 1080p30 requires camera 1080p+, encoder support, and 5+ Mbps
  if (canDo1080p && encoderCaps.supports1080p30 && networkBandwidthKbps >= 4500) {
    return 'high';
  }

  // Medium: 720p30 requires camera 720p+, encoder support, and 2+ Mbps
  if (cameraResolution.width >= 1280 && cameraResolution.height >= 720 &&
      encoderCaps.supports720p30 && networkBandwidthKbps >= 2000) {
    return 'medium';
  }

  // Low: fallback for limited devices
  return 'low';
}
