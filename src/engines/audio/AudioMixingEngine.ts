/**
 * Live Studio Pro - Audio Mixing Engine
 * 
 * Real-time audio processing engine using Web Audio API.
 * Handles microphone input, screen share audio, background music,
 * audio mixing between multiple sources, and audio filters.
 */

import { uid } from "@/app/studio/components/shared/utils";

// Audio source types
export type AudioSourceType = "microphone" | "screenShare" | "backgroundMusic" | "audioFile";

// Audio filter types
export type AudioFilterType = "none" | "noiseReduction" | "lowpass" | "highpass" | "compressor" | "eq";

// Individual audio source configuration
export interface AudioSourceConfig {
    id: string;
    type: AudioSourceType;
    name: string;
    volume: number; // 0-1
    muted: boolean;
    solo: boolean; // solo mode - only this source plays
    pan: number; // -1 to 1
    noiseReductionEnabled: boolean;
}

// Audio filter configuration
export interface AudioFilterConfig {
    type: AudioFilterType;
    enabled: boolean;
    params: Record<string, number>;
}

// Engine state
export interface AudioMixerState {
    initialized: boolean;
    masterVolume: number;
    masterMuted: boolean;
    sources: Map<string, AudioSourceConfig>;
    filters: Map<string, AudioFilterConfig>;
    levels: Map<string, number>; // Audio levels (0-1)
}

// Callback types
export type AudioLevelCallback = (sourceId: string, level: number) => void;
export type AudioErrorCallback = (error: Error) => void;

export class AudioMixingEngine {
    private audioContext: AudioContext | null = null;
    private masterGainNode: GainNode | null = null;
    private masterAnalyserNode: AnalyserNode | null = null;

    // Audio source nodes
    private sourceNodes: Map<string, MediaStreamAudioSourceNode | AudioBufferSourceNode> = new Map();
    private sourceGainNodes: Map<string, GainNode> = new Map();
    private sourcePannerNodes: Map<string, StereoPannerNode> = new Map();
    private sourceAnalyserNodes: Map<string, AnalyserNode> = new Map();

    // Filter nodes chain per source
    private filterChains: Map<string, BiquadFilterNode[]> = new Map();

    // Active media streams
    private mediaStreams: Map<string, MediaStream> = new Map();

    // Audio buffer for playback
    private audioBuffers: Map<string, AudioBuffer> = new Map();
    private playingSources: Map<string, AudioBufferSourceNode> = new Map();

    // State
    private state: AudioMixerState = {
        initialized: false,
        masterVolume: 1,
        masterMuted: false,
        sources: new Map(),
        filters: new Map(),
        levels: new Map(),
    };

    // Callbacks
    private onAudioLevelCallbacks: AudioLevelCallback[] = [];
    private onErrorCallbacks: AudioErrorCallback[] = [];

    // Level monitoring
    private levelUpdateInterval: number | null = null;
    private isMonitoring = false;

    constructor() {
        this.initializeDefaultFilters();
    }

    private initializeDefaultFilters() {
        // Initialize default filter configurations
        this.state.filters.set("noiseReduction", {
            type: "noiseReduction",
            enabled: false,
            params: { threshold: -50, ratio: 4, attack: 0.003, release: 0.25 },
        });

        this.state.filters.set("lowpass", {
            type: "lowpass",
            enabled: false,
            params: { frequency: 20000, Q: 1 },
        });

        this.state.filters.set("highpass", {
            type: "highpass",
            enabled: false,
            params: { frequency: 20, Q: 1 },
        });

        this.state.filters.set("compressor", {
            type: "compressor",
            enabled: false,
            params: { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 },
        });

        this.state.filters.set("eq", {
            type: "eq",
            enabled: false,
            params: { low: 0, mid: 0, high: 0 },
        });
    }

    /**
     * Initialize the audio context and master nodes
     */
    public async initialize(): Promise<boolean> {
        if (this.state.initialized) {
            console.warn("AudioMixingEngine already initialized");
            return true;
        }

        try {
            // Create AudioContext
            this.audioContext = new AudioContext();

            // Resume context if suspended (browser autoplay policy)
            if (this.audioContext.state === "suspended") {
                await this.audioContext.resume();
            }

            // Create master gain node
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.state.masterVolume;

            // Create master analyser for visualization
            this.masterAnalyserNode = this.audioContext.createAnalyser();
            this.masterAnalyserNode.fftSize = 256;
            this.masterAnalyserNode.smoothingTimeConstant = 0.8;

            // Connect master chain
            this.masterGainNode.connect(this.masterAnalyserNode);
            this.masterAnalyserNode.connect(this.audioContext.destination);

            this.state.initialized = true;
            console.log("✅ AudioMixingEngine initialized");

            // Start level monitoring
            this.startLevelMonitoring();

            return true;
        } catch (error) {
            console.error("Failed to initialize AudioMixingEngine:", error);
            this.notifyError(error as Error);
            return false;
        }
    }

    /**
     * Add microphone input source
     */
    public async addMicrophone(deviceId?: string): Promise<string | null> {
        if (!this.state.initialized) {
            await this.initialize();
        }

        try {
            const constraints: MediaStreamConstraints = {
                audio: deviceId ? { deviceId: { exact: deviceId } } : true,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const sourceId = uid("mic_");

            this.addSourceFromStream(sourceId, "microphone", stream, "Microphone");

            console.log("✅ Microphone added:", sourceId);
            return sourceId;
        } catch (error) {
            console.error("Failed to add microphone:", error);
            this.notifyError(error as Error);
            return null;
        }
    }

    /**
     * Add screen share audio
     */
    public async addScreenShareAudio(): Promise<string | null> {
        if (!this.state.initialized) {
            await this.initialize();
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            // Check if audio track exists
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                console.warn("No audio track in screen share");
                // Return null but don't throw - user might still want video
                return null;
            }

            const sourceId = uid("screen_");
            this.addSourceFromStream(sourceId, "screenShare", stream, "Screen Share");

            console.log("✅ Screen share audio added:", sourceId);
            return sourceId;
        } catch (error) {
            console.error("Failed to add screen share audio:", error);
            this.notifyError(error as Error);
            return null;
        }
    }

    /**
     * Add background music from URL
     */
    public async addBackgroundMusic(url: string, name: string = "Background Music"): Promise<string | null> {
        if (!this.state.initialized) {
            await this.initialize();
        }

        try {
            const sourceId = uid("bgm_");

            // Fetch and decode audio
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

            this.audioBuffers.set(sourceId, audioBuffer);

            // Create source config
            const config: AudioSourceConfig = {
                id: sourceId,
                type: "backgroundMusic",
                name,
                volume: 0.5,
                muted: false,
                solo: false,
                pan: 0,
                noiseReductionEnabled: false,
            };

            this.state.sources.set(sourceId, config);

            console.log("✅ Background music added:", sourceId);
            return sourceId;
        } catch (error) {
            console.error("Failed to add background music:", error);
            this.notifyError(error as Error);
            return null;
        }
    }

    /**
     * Add audio file from URL
     */
    public async addAudioFile(url: string, name: string = "Audio File"): Promise<string | null> {
        return this.addBackgroundMusic(url, name);
    }

    /**
     * Add source from MediaStream
     */
    private addSourceFromStream(
        sourceId: string,
        type: AudioSourceType,
        stream: MediaStream,
        name: string
    ): void {
        if (!this.audioContext || !this.masterGainNode) {
            throw new Error("AudioMixingEngine not initialized");
        }

        // Store stream
        this.mediaStreams.set(sourceId, stream);

        // Create source node from stream
        const sourceNode = this.audioContext.createMediaStreamSource(stream);
        this.sourceNodes.set(sourceId, sourceNode);

        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1;
        this.sourceGainNodes.set(sourceId, gainNode);

        // Create panner for stereo positioning
        const pannerNode = this.audioContext.createStereoPanner();
        pannerNode.pan.value = 0;
        this.sourcePannerNodes.set(sourceId, pannerNode);

        // Create analyser for level monitoring
        const analyserNode = this.audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;
        this.sourceAnalyserNodes.set(sourceId, analyserNode);

        // Create filter chain
        const filters = this.createFilterChain(sourceId);
        this.filterChains.set(sourceId, filters);

        // Connect: source -> gain -> filters -> panner -> analyser -> master
        let lastNode: AudioNode = sourceNode;

        // Connect through filters
        for (const filter of filters) {
            lastNode.connect(filter);
            lastNode = filter;
        }

        // Connect to panner
        lastNode.connect(pannerNode);

        // Connect to analyser
        pannerNode.connect(analyserNode);

        // Connect to master
        analyserNode.connect(this.masterGainNode);

        // Store source config
        const config: AudioSourceConfig = {
            id: sourceId,
            type,
            name,
            volume: 1,
            muted: false,
            solo: false,
            pan: 0,
            noiseReductionEnabled: false,
        };

        this.state.sources.set(sourceId, config);
        this.state.levels.set(sourceId, 0);
    }

    /**
     * Create filter chain for a source
     */
    private createFilterChain(sourceId: string): BiquadFilterNode[] {
        if (!this.audioContext) return [];

        const filters: BiquadFilterNode[] = [];

        // Highpass filter to remove low frequency rumble
        const highpass = this.audioContext.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 80;
        filters.push(highpass);

        // Lowpass filter to remove high frequency noise
        const lowpass = this.audioContext.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 16000;
        filters.push(lowpass);

        return filters;
    }

    /**
     * Start playing background music/audio file
     */
    public playAudio(sourceId: string, loop: boolean = true): boolean {
        if (!this.audioContext || !this.audioBuffers.has(sourceId)) {
            console.warn("Audio buffer not found:", sourceId);
            return false;
        }

        // Stop if already playing
        this.stopAudio(sourceId);

        const buffer = this.audioBuffers.get(sourceId)!;
        const config = this.state.sources.get(sourceId);

        // Create new source node
        const sourceNode = this.audioContext.createBufferSource();
        sourceNode.buffer = buffer;
        sourceNode.loop = loop;

        // Create gain node
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = config?.volume ?? 0.5;

        // Create panner
        const pannerNode = this.audioContext.createStereoPanner();
        pannerNode.pan.value = config?.pan ?? 0;

        // Create analyser
        const analyserNode = this.audioContext.createAnalyser();
        analyserNode.fftSize = 256;

        // Connect chain
        sourceNode.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(analyserNode);
        analyserNode.connect(this.masterGainNode!);

        // Start playing
        sourceNode.start();

        // Store nodes
        this.playingSources.set(sourceId, sourceNode);
        this.sourceGainNodes.set(sourceId, gainNode);
        this.sourcePannerNodes.set(sourceId, pannerNode);
        this.sourceAnalyserNodes.set(sourceId, analyserNode);

        console.log("✅ Audio playback started:", sourceId);
        return true;
    }

    /**
     * Stop playing audio
     */
    public stopAudio(sourceId: string): void {
        const sourceNode = this.playingSources.get(sourceId);
        if (sourceNode) {
            try {
                sourceNode.stop();
            } catch (e) {
                // Already stopped
            }
            this.playingSources.delete(sourceId);
        }
    }

    /**
     * Set volume for a specific source
     */
    public setSourceVolume(sourceId: string, volume: number): boolean {
        const config = this.state.sources.get(sourceId);
        if (!config) {
            console.warn("Source not found:", sourceId);
            return false;
        }

        const clampedVolume = Math.max(0, Math.min(1, volume));
        config.volume = clampedVolume;

        const gainNode = this.sourceGainNodes.get(sourceId);
        if (gainNode) {
            gainNode.gain.setValueAtTime(
                config.muted ? 0 : clampedVolume,
                this.audioContext?.currentTime ?? 0
            );
        }

        return true;
    }

    /**
     * Set pan (stereo position) for a source
     */
    public setSourcePan(sourceId: string, pan: number): boolean {
        const config = this.state.sources.get(sourceId);
        if (!config) {
            console.warn("Source not found:", sourceId);
            return false;
        }

        const clampedPan = Math.max(-1, Math.min(1, pan));
        config.pan = clampedPan;

        const pannerNode = this.sourcePannerNodes.get(sourceId);
        if (pannerNode) {
            pannerNode.pan.setValueAtTime(clampedPan, this.audioContext?.currentTime ?? 0);
        }

        return true;
    }

    /**
     * Mute/unmute a specific source
     */
    public setSourceMuted(sourceId: string, muted: boolean): boolean {
        const config = this.state.sources.get(sourceId);
        if (!config) {
            console.warn("Source not found:", sourceId);
            return false;
        }

        config.muted = muted;

        const gainNode = this.sourceGainNodes.get(sourceId);
        if (gainNode) {
            gainNode.gain.setValueAtTime(
                muted ? 0 : config.volume,
                this.audioContext?.currentTime ?? 0
            );
        }

        return true;
    }

    /**
     * Solo/un-solo a specific source (when soloed, only this source plays)
     */
    public setSourceSolo(sourceId: string, solo: boolean): boolean {
        const config = this.state.sources.get(sourceId);
        if (!config) {
            console.warn("Source not found:", sourceId);
            return false;
        }

        config.solo = solo;

        // Update all source gain nodes based on solo state
        this.updateSoloStates();

        return true;
    }

    /**
     * Update gain nodes based on solo states
     */
    private updateSoloStates(): void {
        const hasSoloedSources = Array.from(this.state.sources.values()).some(s => s.solo);

        this.state.sources.forEach((config, sourceId) => {
            const gainNode = this.sourceGainNodes.get(sourceId);
            if (!gainNode) return;

            let targetVolume = config.volume;

            if (config.muted) {
                targetVolume = 0;
            } else if (hasSoloedSources) {
                // If any source is soloed, only soloed sources play
                targetVolume = config.solo ? config.volume : 0;
            }

            gainNode.gain.setValueAtTime(
                targetVolume,
                this.audioContext?.currentTime ?? 0
            );
        });
    }

    /**
     * Set master volume
     */
    public setMasterVolume(volume: number): void {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.state.masterVolume = clampedVolume;

        if (this.masterGainNode) {
            this.masterGainNode.gain.setValueAtTime(
                this.state.masterMuted ? 0 : clampedVolume,
                this.audioContext?.currentTime ?? 0
            );
        }
    }

    /**
     * Mute/unmute master output
     */
    public setMasterMuted(muted: boolean): void {
        this.state.masterMuted = muted;

        if (this.masterGainNode) {
            this.masterGainNode.gain.setValueAtTime(
                muted ? 0 : this.state.masterVolume,
                this.audioContext?.currentTime ?? 0
            );
        }
    }

    /**
     * Apply noise reduction using Web Audio API
     * Uses a dynamics compressor and filter chain for noise reduction
     */
    public enableNoiseReduction(sourceId: string, enable: boolean): boolean {
        const filters = this.filterChains.get(sourceId);
        if (!filters || filters.length < 2) return false;

        // First filter is highpass, second is lowpass
        const highpass = filters[0];
        const lowpass = filters[1];

        if (enable) {
            // Increase highpass to remove more low frequency noise
            highpass.frequency.setValueAtTime(120, this.audioContext?.currentTime ?? 0);
            // Slight reduction in high frequencies
            lowpass.frequency.setValueAtTime(12000, this.audioContext?.currentTime ?? 0);
        } else {
            // Reset to defaults
            highpass.frequency.setValueAtTime(80, this.audioContext?.currentTime ?? 0);
            lowpass.frequency.setValueAtTime(16000, this.audioContext?.currentTime ?? 0);
        }

        // Update filter state
        const noiseFilterConfig = this.state.filters.get("noiseReduction");
        if (noiseFilterConfig) {
            noiseFilterConfig.enabled = enable;
        }

        return true;
    }

    /**
     * Apply lowpass filter
     */
    public setLowpassFilter(sourceId: string, frequency: number): boolean {
        const filters = this.filterChains.get(sourceId);
        if (!filters || filters.length < 2) return false;

        const lowpass = filters[1];
        lowpass.frequency.setValueAtTime(
            Math.max(20, Math.min(20000, frequency)),
            this.audioContext?.currentTime ?? 0
        );

        return true;
    }

    /**
     * Apply highpass filter
     */
    public setHighpassFilter(sourceId: string, frequency: number): boolean {
        const filters = this.filterChains.get(sourceId);
        if (!filters || filters.length < 1) return false;

        const highpass = filters[0];
        highpass.frequency.setValueAtTime(
            Math.max(20, Math.min(20000, frequency)),
            this.audioContext?.currentTime ?? 0
        );

        return true;
    }

    /**
     * Get current audio level for a source
     */
    public getSourceLevel(sourceId: string): number {
        return this.state.levels.get(sourceId) ?? 0;
    }

    /**
     * Get master audio level
     */
    public getMasterLevel(): number {
        if (!this.masterAnalyserNode) return 0;

        const dataArray = new Uint8Array(this.masterAnalyserNode.frequencyBinCount);
        this.masterAnalyserNode.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }

        return sum / (dataArray.length * 255);
    }

    /**
     * Start level monitoring
     */
    private startLevelMonitoring(): void {
        if (this.isMonitoring) return;

        this.isMonitoring = true;

        this.levelUpdateInterval = window.setInterval(() => {
            // Update levels for all sources
            for (const [sourceId, analyser] of this.sourceAnalyserNodes) {
                const level = this.calculateLevel(analyser);
                this.state.levels.set(sourceId, level);

                // Notify callbacks
                for (const callback of this.onAudioLevelCallbacks) {
                    callback(sourceId, level);
                }
            }
        }, 50); // Update every 50ms
    }

    /**
     * Calculate RMS level from analyser
     */
    private calculateLevel(analyser: AnalyserNode): number {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }

        const rms = Math.sqrt(sum / dataArray.length);
        return Math.min(1, rms / 128); // Normalize to 0-1
    }

    /**
     * Remove a source
     */
    public removeSource(sourceId: string): void {
        // Stop playback if audio file
        this.stopAudio(sourceId);

        // Stop media stream tracks
        const stream = this.mediaStreams.get(sourceId);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            this.mediaStreams.delete(sourceId);
        }

        // Disconnect nodes
        const sourceNode = this.sourceNodes.get(sourceId);
        if (sourceNode) {
            sourceNode.disconnect();
            this.sourceNodes.delete(sourceId);
        }

        const gainNode = this.sourceGainNodes.get(sourceId);
        if (gainNode) {
            gainNode.disconnect();
            this.sourceGainNodes.delete(sourceId);
        }

        const pannerNode = this.sourcePannerNodes.get(sourceId);
        if (pannerNode) {
            pannerNode.disconnect();
            this.sourcePannerNodes.delete(sourceId);
        }

        const analyserNode = this.sourceAnalyserNodes.get(sourceId);
        if (analyserNode) {
            analyserNode.disconnect();
            this.sourceAnalyserNodes.delete(sourceId);
        }

        // Remove filter chain
        const filters = this.filterChains.get(sourceId);
        if (filters) {
            filters.forEach(f => f.disconnect());
            this.filterChains.delete(sourceId);
        }

        // Remove audio buffer
        this.audioBuffers.delete(sourceId);

        // Remove from state
        this.state.sources.delete(sourceId);

        this.state.levels.delete(sourceId);

        console.log("✅ Source removed:", sourceId);
    }

    /**
     * Get all sources
     */
    public getSources(): AudioSourceConfig[] {
        return Array.from(this.state.sources.values());
    }

    /**
     * Get source configuration
     */
    public getSource(sourceId: string): AudioSourceConfig | undefined {
        return this.state.sources.get(sourceId);
    }

    /**
     * Get engine state
     */
    public getState(): AudioMixerState {
        return { ...this.state };
    }

    /**
     * Register audio level callback
     */
    public onAudioLevel(callback: AudioLevelCallback): void {
        this.onAudioLevelCallbacks.push(callback);
    }

    /**
     * Register error callback
     */
    public onError(callback: AudioErrorCallback): void {
        this.onErrorCallbacks.push(callback);
    }

    /**
     * Remove audio level callback
     */
    public offAudioLevel(callback: AudioLevelCallback): void {
        const index = this.onAudioLevelCallbacks.indexOf(callback);
        if (index > -1) {
            this.onAudioLevelCallbacks.splice(index, 1);
        }
    }

    /**
     * Notify error callbacks
     */
    private notifyError(error: Error): void {
        for (const callback of this.onErrorCallbacks) {
            callback(error);
        }
    }

    /**
     * Get frequency data for visualization
     */
    public getFrequencyData(sourceId: string): Uint8Array | null {
        const analyser = this.sourceAnalyserNodes.get(sourceId);
        if (!analyser) return null;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    /**
     * Get master frequency data
     */
    public getMasterFrequencyData(): Uint8Array | null {
        if (!this.masterAnalyserNode) return null;

        const dataArray = new Uint8Array(this.masterAnalyserNode.frequencyBinCount);
        this.masterAnalyserNode.getByteFrequencyData(dataArray);
        return dataArray;
    }

    /**
     * Get available audio input devices
     */
    public async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === "audioinput");
    }

    /**
     * Get available audio output devices
     */
    public async getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === "audiooutput");
    }

    /**
     * Suspend the audio context (for pausing)
     */
    public async suspend(): Promise<void> {
        if (this.audioContext && this.audioContext.state === "running") {
            await this.audioContext.suspend();
            console.log("AudioMixingEngine suspended");
        }
    }

    /**
     * Resume the audio context
     */
    public async resume(): Promise<void> {
        if (this.audioContext && this.audioContext.state === "suspended") {
            await this.audioContext.resume();
            console.log("AudioMixingEngine resumed");
        }
    }

    /**
     * Clean up and destroy the engine
     */
    public destroy(): void {
        // Stop level monitoring
        if (this.levelUpdateInterval) {
            clearInterval(this.levelUpdateInterval);
            this.levelUpdateInterval = null;
        }

        // Stop all audio
        for (const sourceId of this.playingSources.keys()) {
            this.stopAudio(sourceId);
        }

        // Remove all sources
        for (const sourceId of this.state.sources.keys()) {
            this.removeSource(sourceId);
        }

        // Disconnect master
        if (this.masterGainNode) {
            this.masterGainNode.disconnect();
            this.masterGainNode = null;
        }

        if (this.masterAnalyserNode) {
            this.masterAnalyserNode.disconnect();
            this.masterAnalyserNode = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Clear state
        this.state.initialized = false;
        this.state.sources.clear();
        this.state.filters.clear();
        this.state.levels.clear();
        this.onAudioLevelCallbacks.length = 0;
        this.onErrorCallbacks.length = 0;

        console.log("✅ AudioMixingEngine destroyed");
    }
}

// Export singleton instance
export const audioMixingEngine = new AudioMixingEngine();
