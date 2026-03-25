/**
 * Scene Composer Type Definitions
 * 
 * Core types for the Pre-Live Lobby Scene Composer including
 * sources, scenes, overlays, templates, and configuration.
 */

// ============================================
// Source Types
// ============================================

export type SourceType =
    | 'camera'      // Webcam/capture device
    | 'screen'      // Screen/window share
    | 'image'       // Static image
    | 'video'       // Video file
    | 'text'        // Text overlay
    | 'browser'     // Webview/URL
    | 'product'     // Product showcase widget
    | 'price'       // Price tag display
    | 'cta'         // Call-to-action button
    | 'widget'      // Timer, stats, etc.
    | 'rtmp';       // External RTMP stream

export type SourceCategory =
    | 'video'       // Cameras, screen share
    | 'media'       // Images, videos
    | 'overlay'     // Text, widgets
    | 'commerce';   // Product, price, CTA

// ============================================
// Canvas Source
// ============================================

export interface CanvasSource {
    // Identity
    id: string;
    name: string;
    type: SourceType;
    category: SourceCategory;

    // State
    enabled: boolean;
    visible: boolean;
    locked: boolean;
    muted: boolean;
    volume: number;        // 0-1

    // Layer ordering
    order: number;
    zIndex: number;

    // Transform (position & size)
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;      // degrees
    scale: { x: number; y: number };

    // Effects
    opacity: number;       // 0-1
    crop?: CropRect;
    filter?: string;       // CSS filter string

    // Type-specific properties
    deviceId?: string;     // For camera
    url?: string;          // For browser/rtmp
    text?: string;         // For text
    imageUrl?: string;     // For image
    videoUrl?: string;     // For video

    // RTMP specific
    rtmpUrl?: string;
    rtmpKey?: string;

    // Commerce specific
    productId?: string;
    productConfig?: ProductWidgetConfig;
}

export interface CropRect {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

// ============================================
// Scene Types
// ============================================

export type SceneLayout =
    | 'full'           // Single source full screen
    | 'split'          // Side-by-side (50/50)
    | 'pip'            // Picture-in-picture
    | 'grid'           // 2x2 or custom grid
    | 'triple'         // 3-source layout
    | 'custom';        // Free-form positioning

export type OverlayType =
    | 'none'
    | 'live_badge'
    | 'viewer_count'
    | 'language_mix'
    | 'lower_third'    // Name/title bar at bottom
    | 'hero'           // Featured product overlay
    | 'ticker'         // Scrolling text
    | 'offer_card'     // Flash deal card
    | 'flash_deal'
    | 'badge';         // Live/viewer badges

export interface Scene {
    // Identity
    id: string;
    name: string;
    description?: string;

    // Layout configuration
    layout: SceneLayout;
    layoutConfig?: LayoutConfig;

    // Sources in scene (ordered by z-index)
    sources: SceneSourceRef[];

    // Overlay configuration
    overlays: OverlayConfig[];

    // Transitions
    transition?: SceneTransition;

    // Output settings
    outputResolution?: Resolution;

    // State
    isActive: boolean;
    isPreview: boolean;

    // Metadata
    thumbnailUrl?: string;
    createdAt: number;
    updatedAt: number;
}

export interface SceneSourceRef {
    sourceId: string;
    zIndex: number;
    locked: boolean;
    visible: boolean;
    transform?: SourceTransform;
}

export interface SourceTransform {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    opacity: number;
    crop?: CropRect;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
}

export interface SceneTransition {
    type: 'cut' | 'fade' | 'slide' | 'wipe' | 'blur';
    duration: number;     // milliseconds
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out';
}

export interface Resolution {
    width: number;
    height: number;
}

// ============================================
// Layout Configuration
// ============================================

export interface LayoutConfig {
    // Split layout
    splitConfig?: {
        position: 'left' | 'right' | 'top' | 'bottom';
        ratio: number;      // 0-1, e.g., 0.5 for 50/50
    };

    // PiP layout
    pipConfig?: {
        mainSourceIndex: number;
        pipPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        pipSize: number;   // 0-1, percentage of canvas
    };

    // Grid layout
    gridConfig?: {
        rows: number;
        cols: number;
        gap: number;       // pixels
        fillMode: 'cover' | 'contain' | 'stretch';
    };

    // Custom layout
    customConfig?: {
        regions: LayoutRegion[];
    };
}

export interface LayoutRegion {
    id: string;
    name: string;
    bounds: { x: number; y: number; width: number; height: number };
    sourceId?: string;
    zIndex: number;
}

// ============================================
// Product Widget
// ============================================

export interface ProductWidgetConfig {
    // Display settings
    displayMode: 'card' | 'banner' | 'badge' | 'carousel';
    position: WidgetPosition;
    size: { width: number; height: number };

    // Content
    showImage: boolean;
    showName: boolean;
    showPrice: boolean;
    showDiscount: boolean;
    showStock: boolean;
    showAddToCart: boolean;
    showBuyNow: boolean;

    // Styling
    theme: 'dark' | 'light' | 'auto';
    borderRadius: number;
    backgroundColor?: string;

    // Animation
    animation?: 'none' | 'slide' | 'fade' | 'pulse';

    // Product selection
    productId?: string;
    autoRotate?: boolean;
    rotationInterval?: number;  // seconds
}

export interface WidgetPosition {
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    offset: { x: number; y: number };
}

// ============================================
// Overlay Configuration
// ============================================

export interface OverlayConfig {
    id: string;
    type: OverlayType;
    enabled: boolean;
    position: OverlayPosition;
    content: OverlayContent;
    style: OverlayStyle;
}

export type OverlayPosition =
    | 'top-left' | 'top-center' | 'top-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface OverlayContent {
    // Badge content
    liveBadge?: {
        show: boolean;
        showTimer: boolean;
        showViewerCount: boolean;
        showLanguageMix: boolean;
    };

    // Product overlay
    productOverlay?: {
        productId: string;
        template: 'hero' | 'card' | 'minimal';
    };

    // Text overlay
    textOverlay?: {
        text: string;
        fontSize: number;
        fontColor: string;
    };

    // Flash deal
    flashDeal?: {
        show: boolean;
        position: OverlayPosition;
        showCountdown: boolean;
        showDiscount: boolean;
    };
}

export interface OverlayStyle {
    backgroundColor: string;
    borderColor: string;
    borderRadius: number;
    padding: number;
    fontSize: number;
    fontColor: string;
    opacity: number;
}

// ============================================
// Scene Template
// ============================================

export interface SceneTemplate {
    id: string;
    name: string;
    description?: string;
    category: 'presentation' | 'product' | 'demo' | 'custom';

    // Thumbnail
    thumbnailUrl?: string;

    // Full scene configuration
    scene: Scene;

    // Metadata
    isBuiltIn: boolean;
    isFavorite: boolean;
    usageCount: number;
    createdAt: number;
    updatedAt: number;
}

// ============================================
// Canvas Settings
// ============================================

export interface CanvasSettings {
    width: number;
    height: number;
    aspectRatio: '16:9' | '9:16' | '4:3' | '1:1';
    backgroundColor: string;
    backgroundImage?: string;
}

// ============================================
// Scene Composer State
// ============================================

export interface SceneComposerState {
    // Scenes
    scenes: Scene[];
    activeSceneId: string;

    // Sources
    sources: CanvasSource[];
    selectedSourceId: string | null;

    // Canvas
    canvasSettings: CanvasSettings;
    zoomLevel: number;
    panOffset: { x: number; y: number };
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;

    // Preview
    previewMode: 'desktop' | 'mobile';
    showOverlays: boolean;

    // Multi-camera
    cameraSources: CameraSourceConfig[];
    activeCameraId: string | null;

    // Templates
    templates: SceneTemplate[];
    favoriteTemplateIds: string[];

    // History (undo/redo)
    history: HistoryEntry[];
    historyIndex: number;

    // UI State
    isEditing: boolean;
    draggedElement: DragState | null;
}

export interface CameraSourceConfig {
    id: string;
    name: string;
    deviceId: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
}

export interface HistoryEntry {
    timestamp: number;
    sceneId: string;
    sources: CanvasSource[];
}

export interface DragState {
    type: 'source' | 'handle' | 'canvas';
    sourceId?: string;
    startPosition: { x: number; y: number };
    currentPosition: { x: number; y: number };
}

// ============================================
// Actions
// ============================================

export type SceneComposerAction =
    // Source actions
    | { type: 'ADD_SOURCE'; payload: { source: CanvasSource } }
    | { type: 'REMOVE_SOURCE'; payload: { sourceId: string } }
    | { type: 'UPDATE_SOURCE'; payload: { sourceId: string; updates: Partial<CanvasSource> } }
    | { type: 'REORDER_SOURCES'; payload: { sourceIds: string[] } }
    | { type: 'SELECT_SOURCE'; payload: { sourceId: string | null } }

    // Scene actions
    | { type: 'ADD_SCENE'; payload: { scene: Scene } }
    | { type: 'REMOVE_SCENE'; payload: { sceneId: string } }
    | { type: 'UPDATE_SCENE'; payload: { sceneId: string; updates: Partial<Scene> } }
    | { type: 'SET_ACTIVE_SCENE'; payload: { sceneId: string } }
    | { type: 'DUPLICATE_SCENE'; payload: { sceneId: string; newName: string } }

    // Transform actions
    | { type: 'MOVE_SOURCE'; payload: { sourceId: string; position: { x: number; y: number } } }
    | { type: 'RESIZE_SOURCE'; payload: { sourceId: string; size: { width: number; height: number } } }
    | { type: 'ROTATE_SOURCE'; payload: { sourceId: string; rotation: number } }

    // Canvas actions
    | { type: 'SET_ZOOM'; payload: { zoom: number } }
    | { type: 'SET_PAN'; payload: { offset: { x: number; y: number } } }
    | { type: 'TOGGLE_GRID'; payload: { show: boolean } }
    | { type: 'SET_SNAP_TO_GRID'; payload: { enabled: boolean } }

    // Template actions
    | { type: 'SAVE_AS_TEMPLATE'; payload: { template: SceneTemplate } }
    | { type: 'LOAD_TEMPLATE'; payload: { templateId: string } }
    | { type: 'DELETE_TEMPLATE'; payload: { templateId: string } }

    // History actions
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'COMMIT_HISTORY' };

// ============================================
// Helper Functions
// ============================================

export function createDefaultCanvasSource(
    type: SourceType,
    id: string,
    name: string
): CanvasSource {
    const category: SourceCategory =
        ['camera', 'screen'].includes(type) ? 'video' :
            ['image', 'video'].includes(type) ? 'media' :
                ['text', 'widget'].includes(type) ? 'overlay' :
                    'commerce';

    return {
        id,
        name,
        type,
        category,
        enabled: true,
        visible: true,
        locked: false,
        muted: false,
        volume: 1,
        order: 0,
        zIndex: 0,
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        opacity: 1,
    };
}

export function createDefaultScene(
    id: string,
    name: string,
    layout: SceneLayout = 'full'
): Scene {
    const now = Date.now();
    return {
        id,
        name,
        layout,
        sources: [],
        overlays: [],
        isActive: false,
        isPreview: true,
        createdAt: now,
        updatedAt: now,
    };
}
