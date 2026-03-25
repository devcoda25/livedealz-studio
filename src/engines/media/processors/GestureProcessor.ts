// Gesture Processor - Hand gesture detection for interactive filters
// Hands loaded dynamically
let mpHands: typeof import("@mediapipe/hands") | null = null;
import { GestureFilterConfig, GESTURE_FILTERS } from '../types';

export type GestureType = 
    | 'none'
    | 'open_palm'
    | 'fist'
    | 'thumbs_up'
    | 'thumbs_down'
    | 'peace'
    | 'wave'
    | 'point'
    | 'ok_sign'
    | 'rock'
    | 'scissors';

export interface GestureState {
    gesture: GestureType;
    handCount: number;
    position?: { x: number; y: number };
    handedness?: 'left' | 'right';
    timestamp: number;
}

export interface GestureEffect {
    id: string;
    type: 'overlay' | 'filter_change' | 'time_effect';
    intensity: number; // 0-1
    triggered: boolean;
}

export class GestureProcessor {
    private hands: any = null;
    private isInitialized: boolean = false;
    private isProcessing: boolean = false;
    
    // Current gesture state
    private currentGesture: GestureState = {
        gesture: 'none',
        handCount: 0,
        timestamp: 0,
    };
    
    // Active gesture filters
    private activeFilter: GestureFilterConfig | null = null;
    private gestureEffects: Map<string, GestureEffect> = new Map();
    
    // Detection callbacks
    private onGestureDetected?: (gesture: GestureType, effect: GestureEffect) => void;
    private onGestureEnded?: (gesture: GestureType) => void;

    constructor() {}

    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        
        console.log("Initializing GestureProcessor with MediaPipe Hands...");
        
        try {
            // Dynamic import for ESM/CJS compatibility
            if (!mpHands) {
                mpHands = await import("@mediapipe/hands");
            }
            
            // @ts-ignore - handle different export styles
            const HandsConstructor = mpHands?.Hands || mpHands?.default?.Hands;
            
            if (!HandsConstructor) {
                console.warn("Hands not available, gesture effects disabled");
                this.isInitialized = true;
                return;
            }
            
            this.hands = new HandsConstructor({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                },
            });
            
            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1, // 1 = full, 0 = lite
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5,
            });
            
            this.hands.onResults(this.onHandsResults.bind(this));
            
            this.isInitialized = true;
            console.log("GestureProcessor initialized.");
        } catch (error) {
            console.error("Failed to initialize Hands:", error);
            throw error;
        }
    }

    private onHandsResults(results: any): void {
        const hands = results.multiHandLandmarks || [];
        const handedness = results.multiHandedness || [];
        
        let detectedGesture: GestureType = 'none';
        let handCount = 0;
        let position: { x: number; y: number } | undefined;
        let handednessResult: 'left' | 'right' | undefined;
        
        if (hands.length > 0) {
            handCount = hands.length;
            
            // Get the first hand's landmarks for gesture detection
            const landmarks = hands[0];
            detectedGesture = this.detectGesture(landmarks);
            
            // Get hand position (wrist landmark)
            if (landmarks[0]) {
                position = {
                    x: landmarks[0].x,
                    y: landmarks[0].y,
                };
            }
            
            // Get handedness
            if (handedness[0]?.label) {
                handednessResult = handedness[0].label.toLowerCase() as 'left' | 'right';
            }
        }
        
        // Update gesture state
        const prevGesture = this.currentGesture.gesture;
        this.currentGesture = {
            gesture: detectedGesture,
            handCount,
            position,
            handedness: handednessResult,
            timestamp: Date.now(),
        };
        
        // Trigger effects if gesture changed
        if (detectedGesture !== prevGesture && this.activeFilter) {
            this.handleGestureChange(detectedGesture, prevGesture);
        }
    }

    private detectGesture(landmarks: any[]): GestureType {
        if (!landmarks || landmarks.length < 21) return 'none';
        
        // Key landmark indices
        const TIP = 8;      // Index finger tip
        const PIP = 6;      // Index finger middle joint
        const THUMB_TIP = 4;
        const THUMB_IP = 2;
        const MIDDLE_TIP = 12;
        const RING_TIP = 16;
        const PINKY_TIP = 20;
        
        // Get landmark positions
        const getY = (idx: number) => landmarks[idx].y;
        const getX = (idx: number) => landmarks[idx].x;
        
        const indexUp = getY(TIP) < getY(PIP);
        const middleUp = getY(MIDDLE_TIP) < getY(12); // 12 is middle finger PIP
        const ringUp = getY(RING_TIP) < getY(14);
        const pinkyUp = getY(PINKY_TIP) < getY(18);
        
        // Thumbs up - thumb is up, other fingers curled
        const thumbUp = getY(THUMB_TIP) < getY(THUMB_IP);
        
        // Thumbs down - thumb is down
        const thumbDown = getY(THUMB_TIP) > getY(THUMB_IP);
        
        // Peace sign - index and middle up, others down
        const peace = indexUp && middleUp && !ringUp && !pinkyUp;
        
        // Open palm - all fingers up
        const openPalm = indexUp && middleUp && ringUp && pinkyUp;
        
        // Fist - all fingers curled
        const fist = !indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp;
        
        // Point - only index finger extended
        const point = indexUp && !middleUp && !ringUp && !pinkyUp;
        
        // OK sign - thumb and index form a circle
        const okSign = this.checkOkSign(landmarks);
        
        // Rock - index and pinky up
        const rock = indexUp && !middleUp && !ringUp && pinkyUp;
        
        // Scissors - index and middle up, ring and pinky down
        const scissors = indexUp && middleUp && !ringUp && !pinkyUp;
        
        // Wave - rapid left-right motion (detected over time, here we just check pose)
        // For wave detection, we need temporal analysis
        
        // Determine gesture
        if (openPalm) return 'open_palm';
        if (fist) return 'fist';
        if (thumbUp && !indexUp && !middleUp) return 'thumbs_up';
        if (thumbDown && !indexUp && !middleUp) return 'thumbs_down';
        if (peace) return 'peace';
        if (point) return 'point';
        if (okSign) return 'ok_sign';
        if (rock) return 'rock';
        if (scissors) return 'scissors';
        
        // Check for wave (simplified - requires motion)
        if (this.isWaveMotion()) return 'wave';
        
        return 'none';
    }

    private checkOkSign(landmarks: any[]): boolean {
        // Check if thumb tip and index tip are close together
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + 
            Math.pow(thumbTip.y - indexTip.y, 2)
        );
        
        // If thumb and index are close, it's an OK sign
        return distance < 0.05;
    }

    private waveMotionHistory: number[] = [];
    private lastWaveCheck: number = 0;
    
    private isWaveMotion(): boolean {
        const now = Date.now();
        
        // Only check every 100ms
        if (now - this.lastWaveCheck < 100) return false;
        this.lastWaveCheck = now;
        
        if (!this.currentGesture.position) return false;
        
        // Add x position to history
        this.waveMotionHistory.push(this.currentGesture.position.x);
        
        // Keep only last 20 frames
        if (this.waveMotionHistory.length > 20) {
            this.waveMotionHistory.shift();
        }
        
        // Check for alternating direction (wave pattern)
        if (this.waveMotionHistory.length < 10) return false;
        
        let directionChanges = 0;
        for (let i = 1; i < this.waveMotionHistory.length; i++) {
            const diff = this.waveMotionHistory[i] - this.waveMotionHistory[i - 1];
            const prevDiff = this.waveMotionHistory[i - 1] - this.waveMotionHistory[i - 2] || 0;
            
            if ((diff > 0.01 && prevDiff < -0.01) || (diff < -0.01 && prevDiff > 0.01)) {
                directionChanges++;
            }
        }
        
        // If there are multiple direction changes, it's a wave
        return directionChanges >= 3;
    }

    private handleGestureChange(newGesture: GestureType, prevGesture: GestureType): void {
        if (!this.activeFilter) return;
        
        // Check if the new gesture matches our active filter's trigger gesture
        const triggerGesture = this.activeFilter.gesture;
        
        if (newGesture === triggerGesture || triggerGesture === 'any') {
            const effect: GestureEffect = {
                id: this.activeFilter.id,
                type: this.activeFilter.triggerType === 'toggle' ? 'filter_change' : 'overlay',
                intensity: 1,
                triggered: true,
            };
            
            this.gestureEffects.set(this.activeFilter.id, effect);
            this.onGestureDetected?.(newGesture, effect);
        } else if (prevGesture === triggerGesture) {
            // Gesture ended
            this.gestureEffects.delete(this.activeFilter.id);
            this.onGestureEnded?.(prevGesture);
        }
    }

    setFilter(filter: GestureFilterConfig | null): void {
        this.activeFilter = filter;
        
        // Reset effects when filter changes
        this.gestureEffects.clear();
        
        if (filter) {
            console.log("Gesture filter set to:", filter.name);
        }
    }

    // Process a video frame for hand detection
    async process(video: HTMLVideoElement): Promise<GestureState> {
        if (!this.isInitialized || !this.hands || this.isProcessing) {
            return this.currentGesture;
        }
        
        this.isProcessing = true;
        
        try {
            await this.hands.send({ image: video });
        } catch (error) {
            console.warn("Hands processing error:", error);
        }
        
        this.isProcessing = false;
        
        return this.currentGesture;
    }

    // Get current gesture state
    getGestureState(): GestureState {
        return this.currentGesture;
    }

    // Get active effects
    getActiveEffects(): GestureEffect[] {
        return Array.from(this.gestureEffects.values());
    }

    // Check if a specific gesture is currently active
    isGestureActive(gesture: GestureType): boolean {
        return this.currentGesture.gesture === gesture;
    }

    // Set callback for gesture detection
    setOnGestureDetected(callback: (gesture: GestureType, effect: GestureEffect) => void): void {
        this.onGestureDetected = callback;
    }

    setOnGestureEnded(callback: (gesture: GestureType) => void): void {
        this.onGestureEnded = callback;
    }

    // Get hand landmarks for AR overlay positioning
    getHandLandmarks(): any[] | null {
        return null; // Would need to store from onResults
    }

    // Static method to get available gesture filters
    static getGestureFilters(): GestureFilterConfig[] {
        return GESTURE_FILTERS;
    }

    dispose(): void {
        this.hands = null;
        this.activeFilter = null;
        this.gestureEffects.clear();
        this.waveMotionHistory = [];
        this.isInitialized = false;
    }
}

export default GestureProcessor;
