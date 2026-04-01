// Filter Types and Configurations for TikTok-Style Filter Engine

export enum FilterCategory {
    BEAUTY = "beauty",
    COLOR = "color",
    AR_FACE = "ar_face",
    BACKGROUND = "background",
    GREEN_SCREEN = "green_screen",
    GESTURE = "gesture",
    TIME = "time"
}

export interface FilterDefinition {
    id: string;
    name: string;
    category: FilterCategory;
    icon: string;
    description?: string;
}

export interface ColorFilterConfig extends FilterDefinition {
    category: FilterCategory.COLOR | FilterCategory.BEAUTY;
    cssFilter: string;
    glslFragmentShader?: string;
}

export interface ARFilterConfig extends FilterDefinition {
    category: FilterCategory.AR_FACE;
    assetType: 'image' | 'sprite' | 'animated' | 'beauty' | 'segmentation';
    anchorPoint: string; // Which face landmark to attach to
    scale: number;
    offset: { x: number; y: number };
    animation?: string;
}

export interface BackgroundFilterConfig extends FilterDefinition {
    category: FilterCategory.BACKGROUND;
    type: 'blur' | 'solid' | 'image' | 'video' | 'ar';
    value?: string; // Color hex, image URL, or video URL
    blurAmount?: number;
}

export interface ChromaKeyConfig extends FilterDefinition {
    category: FilterCategory.GREEN_SCREEN;
    keyColor: 'green' | 'blue' | 'custom';
    customHue?: number;
    saturationThreshold: number;
    lightnessThreshold: number;
    smoothness: number;
}

export interface GestureFilterConfig extends FilterDefinition {
    category: FilterCategory.GESTURE;
    gesture: string;
    effect: string;
    triggerType: 'appear' | 'toggle' | 'intensity';
}

export interface TimeEffectConfig extends FilterDefinition {
    category: FilterCategory.TIME;
    effect: 'slow_mo' | 'fast_forward' | 'rewind' | 'freeze' | 'motion_blur' | 'echo';
    speed?: number; // For slow-mo/fast-forward
    duration?: number; // For freeze
    intensity?: number; // For motion_blur/echo
}

export type AnyFilterConfig = 
    | ColorFilterConfig 
    | ARFilterConfig 
    | BackgroundFilterConfig 
    | ChromaKeyConfig 
    | GestureFilterConfig 
    | TimeEffectConfig;

// TikTok-Style Color Presets
export const COLOR_FILTERS: ColorFilterConfig[] = [
    {
        id: 'none',
        name: 'None',
        category: FilterCategory.COLOR,
        icon: 'block',
        cssFilter: 'none',
    },
    {
        id: 'classic',
        name: 'Classic',
        category: FilterCategory.COLOR,
        icon: 'movie',
        description: 'Original TikTok look',
        cssFilter: 'sepia(0.15) contrast(1.1) saturate(1.2) brightness(1.02)',
    },
    {
        id: 'warm',
        name: 'Warm',
        category: FilterCategory.COLOR,
        icon: 'wb_sunny',
        description: 'Golden hour warmth',
        cssFilter: 'sepia(0.3) saturate(1.4) brightness(1.05) contrast(1.05)',
    },
    {
        id: 'cool',
        name: 'Cool',
        category: FilterCategory.COLOR,
        icon: 'ac_unit',
        description: 'Cool blue tones',
        cssFilter: 'hue-rotate(190deg) saturate(0.9) brightness(1.05) contrast(1.05)',
    },
    {
        id: 'vintage',
        name: 'Vintage',
        category: FilterCategory.COLOR,
        icon: 'filter_vintage',
        description: 'Retro film look',
        cssFilter: 'sepia(0.4) contrast(1.1) saturate(0.8) brightness(0.95)',
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        category: FilterCategory.COLOR,
        icon: 'theaters',
        description: 'Movie-grade color',
        cssFilter: 'contrast(1.2) saturate(1.1) brightness(0.95) sepia(0.1)',
    },
    {
        id: 'dramatic',
        name: 'Dramatic',
        category: FilterCategory.COLOR,
        icon: 'flash_on',
        description: 'High contrast',
        cssFilter: 'contrast(1.4) saturate(1.3) brightness(0.9)',
    },
    {
        id: 'dreamy',
        name: 'Dreamy',
        category: FilterCategory.COLOR,
        icon: 'cloud',
        description: 'Soft ethereal look',
        cssFilter: 'brightness(1.15) saturate(1.1) blur(0.3px) contrast(1.05)',
    },
    {
        id: 'noir',
        name: 'Noir',
        category: FilterCategory.COLOR,
        icon: 'filter_b_and_w',
        description: 'Black & white',
        cssFilter: 'grayscale(1) contrast(1.2) brightness(0.95)',
    },
    {
        id: 'neon',
        name: 'Neon',
        category: FilterCategory.COLOR,
        icon: 'bolt',
        description: 'Vibrant neon glow',
        cssFilter: 'hue-rotate(320deg) contrast(1.5) saturate(2) brightness(1.1)',
    },
    {
        id: 'invert',
        name: 'Invert',
        category: FilterCategory.COLOR,
        icon: 'invert_colors',
        description: 'Inverted colors',
        cssFilter: 'invert(1)',
    },
];

// Beauty Filters
export const BEAUTY_FILTERS: ColorFilterConfig[] = [
    {
        id: 'soft_glam',
        name: 'Soft Glam',
        category: FilterCategory.BEAUTY,
        icon: 'face_retouching_natural',
        description: 'Soft glowing skin',
        cssFilter: 'brightness(1.05) contrast(1.02) saturate(0.95) blur(0.5px)',
    },
    {
        id: 'radiance',
        name: 'Radiance',
        category: FilterCategory.BEAUTY,
        icon: 'flare',
        description: 'Glowing skin effect',
        cssFilter: 'brightness(1.1) saturate(1.15) blur(0.3px)',
    },
    {
        id: 'porcelain',
        name: 'Porcelain',
        category: FilterCategory.BEAUTY,
        icon: 'face',
        description: 'Clear flawless skin',
        cssFilter: 'brightness(1.12) contrast(0.9) saturate(0.85) blur(0.5px)',
    },
    {
        id: 'acne_remove',
        name: 'Clean Skin',
        category: FilterCategory.BEAUTY,
        icon: 'auto_fix_high',
        description: 'Skin smoothing',
        cssFilter: 'brightness(1.03) contrast(0.98) blur(1px) saturate(0.95)',
    },
];

// AR Face Filters
export const AR_FACE_FILTERS: ARFilterConfig[] = [
    {
        id: 'beauty_smooth',
        name: 'Smooth Skin',
        category: FilterCategory.AR_FACE,
        icon: 'spa',
        assetType: 'beauty',
        anchorPoint: 'face',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'beauty_teeth',
        name: 'Teeth Whitening',
        category: FilterCategory.AR_FACE,
        icon: 'sentiment_satisfied',
        assetType: 'beauty',
        anchorPoint: 'face',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'beauty_eyes',
        name: 'Eye Enlarge',
        category: FilterCategory.AR_FACE,
        icon: 'visibility',
        assetType: 'beauty',
        anchorPoint: 'eyes',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'face_slim',
        name: 'Slim Face',
        category: FilterCategory.AR_FACE,
        icon: 'face_retouching_natural',
        assetType: 'beauty',
        anchorPoint: 'face',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'nose_thin',
        name: 'Thin Nose',
        category: FilterCategory.AR_FACE,
        icon: 'face',
        assetType: 'beauty',
        anchorPoint: 'nose',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'chin_length',
        name: 'Long Chin',
        category: FilterCategory.AR_FACE,
        icon: 'arrow_upward',
        assetType: 'beauty',
        anchorPoint: 'chin',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'forehead',
        name: 'Forehead',
        category: FilterCategory.AR_FACE,
        icon: 'face_5',
        assetType: 'beauty',
        anchorPoint: 'forehead',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'eye_color_blue',
        name: 'Blue Eyes',
        category: FilterCategory.AR_FACE,
        icon: 'visibility',
        assetType: 'segmentation',
        anchorPoint: 'eyes',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'eye_color_green',
        name: 'Green Eyes',
        category: FilterCategory.AR_FACE,
        icon: 'visibility',
        assetType: 'segmentation',
        anchorPoint: 'eyes',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'eye_color_amber',
        name: 'Amber Eyes',
        category: FilterCategory.AR_FACE,
        icon: 'visibility',
        assetType: 'segmentation',
        anchorPoint: 'eyes',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'lip_red',
        name: 'Red Lips',
        category: FilterCategory.AR_FACE,
        icon: 'favorite',
        assetType: 'segmentation',
        anchorPoint: 'lips',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'lip_pink',
        name: 'Pink Lips',
        category: FilterCategory.AR_FACE,
        icon: 'favorite',
        assetType: 'segmentation',
        anchorPoint: 'lips',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'lip_nude',
        name: 'Nude Lips',
        category: FilterCategory.AR_FACE,
        icon: 'favorite',
        assetType: 'segmentation',
        anchorPoint: 'lips',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'hair_color_ruby',
        name: 'Ruby Hair',
        category: FilterCategory.AR_FACE,
        icon: 'palette',
        assetType: 'segmentation',
        anchorPoint: 'hair',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'hair_color_platinum',
        name: 'Platinum Hair',
        category: FilterCategory.AR_FACE,
        icon: 'palette',
        assetType: 'segmentation',
        anchorPoint: 'hair',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'hair_color_midnight',
        name: 'Midnight Hair',
        category: FilterCategory.AR_FACE,
        icon: 'palette',
        assetType: 'segmentation',
        anchorPoint: 'hair',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'skin_warm',
        name: 'Warm Skin',
        category: FilterCategory.AR_FACE,
        icon: 'wb_sunny',
        assetType: 'segmentation',
        anchorPoint: 'face',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
    {
        id: 'skin_cool',
        name: 'Cool Skin',
        category: FilterCategory.AR_FACE,
        icon: 'ac_unit',
        assetType: 'segmentation',
        anchorPoint: 'face',
        scale: 1.0,
        offset: { x: 0, y: 0 },
    },
];

// Background Filters
export const BACKGROUND_FILTERS: BackgroundFilterConfig[] = [
    {
        id: 'bg_none',
        name: 'None',
        category: FilterCategory.BACKGROUND,
        icon: 'wallpaper',
        type: 'ar',
    },
    {
        id: 'bg_blur_lite',
        name: 'Blur Lite',
        category: FilterCategory.BACKGROUND,
        icon: 'blur_on',
        type: 'blur',
        blurAmount: 5,
    },
    {
        id: 'bg_blur_medium',
        name: 'Blur Medium',
        category: FilterCategory.BACKGROUND,
        icon: 'blur_on',
        type: 'blur',
        blurAmount: 10,
    },
    {
        id: 'bg_blur_heavy',
        name: 'Blur Heavy',
        category: FilterCategory.BACKGROUND,
        icon: 'blur_on',
        type: 'blur',
        blurAmount: 20,
    },
    {
        id: 'bg_dim',
        name: 'Dim',
        category: FilterCategory.BACKGROUND,
        icon: 'dark_mode',
        type: 'solid',
        value: 'rgba(0,0,0,0.5)',
    },
    {
        id: 'bg_black',
        name: 'Black',
        category: FilterCategory.BACKGROUND,
        icon: 'black',
        type: 'solid',
        value: '#000000',
    },
];

// Gesture Filters
export const GESTURE_FILTERS: GestureFilterConfig[] = [
    {
        id: 'gesture_wave',
        name: 'Wave Magic',
        category: FilterCategory.GESTURE,
        icon: 'pan_tool',
        gesture: 'wave',
        effect: 'sparkles',
        triggerType: 'appear',
    },
    {
        id: 'gesture_thumbsup',
        name: 'Hearts',
        category: FilterCategory.GESTURE,
        icon: 'thumb_up',
        gesture: 'thumbs_up',
        effect: 'hearts',
        triggerType: 'appear',
    },
    {
        id: 'gesture_peace',
        name: 'Peace Split',
        category: FilterCategory.GESTURE,
        icon: 'vpn_key',
        gesture: 'peace',
        effect: 'split',
        triggerType: 'toggle',
    },
    {
        id: 'gesture_open_hand',
        name: 'Slow Motion',
        category: FilterCategory.GESTURE,
        icon: 'slow_motion_video',
        gesture: 'open_palm',
        effect: 'slow_mo',
        triggerType: 'toggle',
    },
];

// Time Effects
export const TIME_EFFECTS: TimeEffectConfig[] = [
    {
        id: 'time_normal',
        name: 'Normal',
        category: FilterCategory.TIME,
        icon: 'play_arrow',
        effect: 'slow_mo',
        speed: 1,
    },
    {
        id: 'time_slow_05',
        name: 'Slow 0.5x',
        category: FilterCategory.TIME,
        icon: 'slow_motion_video',
        effect: 'slow_mo',
        speed: 0.5,
    },
    {
        id: 'time_slow_025',
        name: 'Slow 0.25x',
        category: FilterCategory.TIME,
        icon: 'slow_motion_video',
        effect: 'slow_mo',
        speed: 0.25,
    },
    {
        id: 'time_fast_2',
        name: 'Fast 2x',
        category: FilterCategory.TIME,
        icon: 'fast_forward',
        effect: 'fast_forward',
        speed: 2,
    },
    {
        id: 'time_fast_4',
        name: 'Fast 4x',
        category: FilterCategory.TIME,
        icon: 'fast_forward',
        effect: 'fast_forward',
        speed: 4,
    },
    {
        id: 'time_freeze',
        name: 'Freeze',
        category: FilterCategory.TIME,
        icon: 'pause_circle',
        effect: 'freeze',
        duration: 3000,
    },
    {
        id: 'time_motion_blur',
        name: 'Motion Blur',
        category: FilterCategory.TIME,
        icon: 'motion_photos_on',
        effect: 'motion_blur',
        intensity: 0.5,
    },
    {
        id: 'time_echo',
        name: 'Echo',
        category: FilterCategory.TIME,
        icon: 'replay',
        effect: 'echo',
        intensity: 0.3,
    },
];

// Chroma Key Filters
export const CHROMA_KEY_FILTERS: ChromaKeyConfig[] = [
    {
        id: 'chroma_off',
        name: 'Off',
        category: FilterCategory.GREEN_SCREEN,
        icon: 'green_screen',
        keyColor: 'green',
        saturationThreshold: 0,
        lightnessThreshold: 0,
        smoothness: 0,
    },
    {
        id: 'chroma_green',
        name: 'Green Screen',
        category: FilterCategory.GREEN_SCREEN,
        icon: 'green_screen',
        keyColor: 'green',
        saturationThreshold: 0.2,
        lightnessThreshold: 0.1,
        smoothness: 0.5,
    },
    {
        id: 'chroma_blue',
        name: 'Blue Screen',
        category: FilterCategory.GREEN_SCREEN,
        icon: 'green_screen',
        keyColor: 'blue',
        saturationThreshold: 0.2,
        lightnessThreshold: 0.1,
        smoothness: 0.5,
    },
];

// Get all filters
export const ALL_FILTERS: AnyFilterConfig[] = [
    ...COLOR_FILTERS,
    ...BEAUTY_FILTERS,
    ...AR_FACE_FILTERS,
    ...BACKGROUND_FILTERS,
    ...GESTURE_FILTERS,
    ...TIME_EFFECTS,
    ...CHROMA_KEY_FILTERS,
];

// Get filter by ID
export function getFilterById(id: string): AnyFilterConfig | undefined {
    return ALL_FILTERS.find(f => f.id === id);
}

// Get filters by category
export function getFiltersByCategory(category: FilterCategory): AnyFilterConfig[] {
    return ALL_FILTERS.filter(f => f.category === category);
}
