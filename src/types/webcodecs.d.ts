// WebCodecs API type declarations
// These types are not yet officially available in TypeScript

declare global {
    interface VideoEncoderConfig {
        codec: string;
        width: number | { min: number; max: number };
        height: number | { min: number; max: number };
        bitrate: number | { min: number; max: number };
        framerate: number | { min: number; max: number };
        latencyMode?: string;
        [key: string]: any; // Allow additional properties like codecType
    }

    interface AudioEncoderConfig {
        codec: string;
        sampleRate: number;
        numberOfChannels: number;
        bitrate: number;
    }

    interface EncodedVideoChunk {
        type: 'key' | 'delta';
        timestamp: number;
        duration?: number;
        byteLength: number;
        data?: ArrayBuffer; // Some implementations have this
        copyTo(buffer: ArrayBuffer): void;
    }

    interface EncodedAudioChunk {
        type: 'key' | 'delta';
        timestamp: number;
        duration?: number;
        byteLength: number;
        data?: ArrayBuffer; // Some implementations have this
        copyTo(buffer: ArrayBuffer): void;
    }

    interface VideoFrameMetadata {
        presentationTime: number;
        expectedDisplayTime?: number;
        width?: number;
        height?: number;
        mediaTime?: number;
        timestamp?: number;
        spatialLayers?: any[];
        temporalLayers?: any[];
    }

    interface VideoEncoder {
        configure(config: VideoEncoderConfig): void;
        encode(frame: VideoFrame, options?: { keyFrame?: boolean }): void;
        flush(): Promise<void>;
        close(): void;
        isConfigSupported(config: VideoEncoderConfig): Promise<VideoEncoderSupport>;
    }

    interface VideoEncoderSupport {
        supported: boolean;
        config?: VideoEncoderConfig;
    }

    interface AudioEncoder {
        configure(config: AudioEncoderConfig): void;
        encode(frame: AudioData): void;
        flush(): Promise<void>;
        close(): void;
        isConfigSupported(config: AudioEncoderConfig): Promise<AudioEncoderSupport>;
    }

    interface AudioEncoderSupport {
        supported: boolean;
        config?: AudioEncoderConfig;
    }

    class VideoEncoder {
        constructor(init: VideoEncoderInit);
    }

    class AudioEncoder {
        constructor(init: AudioEncoderInit);
    }

    interface VideoEncoderInit {
        output: (chunk: EncodedVideoChunk, metadata?: VideoFrameMetadata) => void;
        error: (error: Error) => void;
    }

    interface AudioEncoderInit {
        output: (chunk: EncodedAudioChunk) => void;
        error: (error: Error) => void;
    }

    class VideoFrame {
        constructor(image: ImageBitmapSource, init?: VideoFrameInit);
        readonly format: VideoPixelFormat | null;
        readonly timestamp: number;
        readonly duration: number;
        readonly codedWidth: number;
        readonly codedHeight: number;
        readonly displayWidth: number;
        readonly displayHeight: number;
        copyTo(dest: ArrayBuffer): Promise<ArrayBuffer>;
        close(): void;
    }

    interface VideoFrameInit {
        timestamp?: number;
        duration?: number;
        type?: string;
    }

    type VideoPixelFormat =
        | 'I420'
        | 'I420A'
        | 'I422'
        | 'I444'
        | 'NV12'
        | 'RGBA'
        | 'RGBX'
        | 'BGRA'
        | 'BGRX';

    class AudioData {
        constructor(init: AudioDataInit);
        readonly format: AudioSampleFormat | null;
        readonly sampleRate: number;
        readonly numberOfFrames: number;
        readonly numberOfChannels: number;
        readonly duration: number;
        readonly timestamp: number;
        copyTo(dest: AudioDataCopyToOptions): number;
        close(): void;
    }

    interface AudioDataInit {
        format: AudioSampleFormat;
        sampleRate: number;
        numberOfFrames: number;
        numberOfChannels: number;
        timestamp: number;
        data: Int16Array | Int32Array | Float32Array;
    }

    interface AudioDataCopyToOptions {
        planeIndex: number;
        format: AudioSampleFormat;
        buffer: ArrayBuffer;
        byteOffset?: number;
        byteLength?: number;
    }

    type AudioSampleFormat = 'u8' | 's16' | 's32' | 'f32' | 'u8-planar' | 's16-planar' | 's32-planar' | 'f32-planar';
}

export { };
