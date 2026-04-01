import { FilterCategory, FilterDefinition } from "../../../engines/media/types";

// Filter Categories with all TikTok-style filters
export const FILTER_CATEGORIES: { id: FilterCategory; label: string; icon: string; filters: FilterDefinition[] }[] = [
    {
        id: FilterCategory.BEAUTY,
        label: "Beauty",
        icon: "face_retouching_natural",
        filters: [
            { id: "beauty_none", name: "None", category: FilterCategory.BEAUTY, icon: "block" },
            { id: "soft_glam", name: "Soft Glam", category: FilterCategory.BEAUTY, icon: "face_retouching_natural" },
            { id: "radiance", name: "Radiance", category: FilterCategory.BEAUTY, icon: "flare" },
            { id: "porcelain", name: "Porcelain", category: FilterCategory.BEAUTY, icon: "face" },
            { id: "acne_remove", name: "Clean Skin", category: FilterCategory.BEAUTY, icon: "auto_fix_high" },
        ]
    },
    {
        id: FilterCategory.COLOR,
        label: "Filters",
        icon: "palette",
        filters: [
            { id: "none", name: "None", category: FilterCategory.COLOR, icon: "block" },
            { id: "classic", name: "Classic", category: FilterCategory.COLOR, icon: "movie" },
            { id: "warm", name: "Warm", category: FilterCategory.COLOR, icon: "wb_sunny" },
            { id: "cool", name: "Cool", category: FilterCategory.COLOR, icon: "ac_unit" },
            { id: "vintage", name: "Vintage", category: FilterCategory.COLOR, icon: "filter_vintage" },
            { id: "cinematic", name: "Cinematic", category: FilterCategory.COLOR, icon: "theaters" },
            { id: "dramatic", name: "Dramatic", category: FilterCategory.COLOR, icon: "flash_on" },
            { id: "dreamy", name: "Dreamy", category: FilterCategory.COLOR, icon: "cloud" },
            { id: "noir", name: "Noir", category: FilterCategory.COLOR, icon: "filter_b_and_w" },
            { id: "neon", name: "Neon", category: FilterCategory.COLOR, icon: "bolt" },
            { id: "invert", name: "Invert", category: FilterCategory.COLOR, icon: "invert_colors" },
        ]
    },
    {
        id: FilterCategory.AR_FACE,
        label: "AR",
        icon: "face",
        filters: [
            { id: "ar_none", name: "None", category: FilterCategory.AR_FACE, icon: "block" },
            // Face beautification
            { id: "beauty_smooth", name: "Smooth Skin", category: FilterCategory.AR_FACE, icon: "spa" },
            { id: "beauty_teeth", name: "Teeth Whitening", category: FilterCategory.AR_FACE, icon: "sentiment_satisfied" },
            { id: "beauty_eyes", name: "Eye Enlarge", category: FilterCategory.AR_FACE, icon: "visibility" },
            // Face shaping
            { id: "face_slim", name: "Slim Face", category: FilterCategory.AR_FACE, icon: "face_retouching_natural" },
            { id: "nose_thin", name: "Thin Nose", category: FilterCategory.AR_FACE, icon: "face" },
            { id: "chin_length", name: "Long Chin", category: FilterCategory.AR_FACE, icon: "arrow_upward" },
            { id: "forehead", name: "Forehead", category: FilterCategory.AR_FACE, icon: "face_5" },
            // Eye colors
            { id: "eye_color_blue", name: "Blue Eyes", category: FilterCategory.AR_FACE, icon: "visibility" },
            { id: "eye_color_green", name: "Green Eyes", category: FilterCategory.AR_FACE, icon: "visibility" },
            { id: "eye_color_amber", name: "Amber Eyes", category: FilterCategory.AR_FACE, icon: "visibility" },
            // Lip colors
            { id: "lip_red", name: "Red Lips", category: FilterCategory.AR_FACE, icon: "favorite" },
            { id: "lip_pink", name: "Pink Lips", category: FilterCategory.AR_FACE, icon: "favorite" },
            { id: "lip_nude", name: "Nude Lips", category: FilterCategory.AR_FACE, icon: "favorite" },
            // Hair colors
            { id: "hair_color_ruby", name: "Ruby Hair", category: FilterCategory.AR_FACE, icon: "palette" },
            { id: "hair_color_platinum", name: "Platinum Hair", category: FilterCategory.AR_FACE, icon: "palette" },
            { id: "hair_color_midnight", name: "Midnight Hair", category: FilterCategory.AR_FACE, icon: "palette" },
            // Skin tone
            { id: "skin_warm", name: "Warm Skin", category: FilterCategory.AR_FACE, icon: "wb_sunny" },
            { id: "skin_cool", name: "Cool Skin", category: FilterCategory.AR_FACE, icon: "ac_unit" },
        ]
    },
    {
        id: FilterCategory.BACKGROUND,
        label: "Background",
        icon: "wallpaper",
        filters: [
            { id: "bg_none", name: "None", category: FilterCategory.BACKGROUND, icon: "wallpaper" },
            { id: "bg_blur_lite", name: "Blur Lite", category: FilterCategory.BACKGROUND, icon: "blur_on" },
            { id: "bg_blur_medium", name: "Blur Medium", category: FilterCategory.BACKGROUND, icon: "blur_on" },
            { id: "bg_blur_heavy", name: "Blur Heavy", category: FilterCategory.BACKGROUND, icon: "blur_on" },
            { id: "bg_dim", name: "Dim", category: FilterCategory.BACKGROUND, icon: "dark_mode" },
            { id: "bg_black", name: "Black", category: FilterCategory.BACKGROUND, icon: "black" },
        ]
    },
    {
        id: FilterCategory.GREEN_SCREEN,
        label: "Chroma",
        icon: "green_screen",
        filters: [
            { id: "chroma_off", name: "Off", category: FilterCategory.GREEN_SCREEN, icon: "green_screen" },
            { id: "chroma_green", name: "Green Screen", category: FilterCategory.GREEN_SCREEN, icon: "green_screen" },
            { id: "chroma_blue", name: "Blue Screen", category: FilterCategory.GREEN_SCREEN, icon: "green_screen" },
        ]
    },
    {
        id: FilterCategory.GESTURE,
        label: "Gesture",
        icon: "pan_tool",
        filters: [
            { id: "gesture_none", name: "Off", category: FilterCategory.GESTURE, icon: "pan_tool" },
            { id: "gesture_wave", name: "Wave Magic", category: FilterCategory.GESTURE, icon: "pan_tool" },
            { id: "gesture_thumbsup", name: "Hearts", category: FilterCategory.GESTURE, icon: "thumb_up" },
            { id: "gesture_peace", name: "Peace Split", category: FilterCategory.GESTURE, icon: "vpn_key" },
            { id: "gesture_open_hand", name: "Slow Motion", category: FilterCategory.GESTURE, icon: "slow_motion_video" },
        ]
    },
    {
        id: FilterCategory.TIME,
        label: "Time",
        icon: "slow_motion_video",
        filters: [
            { id: "time_normal", name: "Normal", category: FilterCategory.TIME, icon: "play_arrow" },
            { id: "time_slow_05", name: "Slow 0.5x", category: FilterCategory.TIME, icon: "slow_motion_video" },
            { id: "time_slow_025", name: "Slow 0.25x", category: FilterCategory.TIME, icon: "slow_motion_video" },
            { id: "time_fast_2", name: "Fast 2x", category: FilterCategory.TIME, icon: "fast_forward" },
            { id: "time_fast_4", name: "Fast 4x", category: FilterCategory.TIME, icon: "fast_forward" },
            { id: "time_freeze", name: "Freeze", category: FilterCategory.TIME, icon: "pause_circle" },
            { id: "time_motion_blur", name: "Motion Blur", category: FilterCategory.TIME, icon: "motion_photos_on" },
            { id: "time_echo", name: "Echo", category: FilterCategory.TIME, icon: "replay" },
        ]
    },
];

export const getFilterStyle = (id: string) => {
    for (const cat of FILTER_CATEGORIES) {
        const found = cat.filters.find(f => f.id === id);
        if (found) return found;
    }
    return null;
};

export const getFilterByCategory = (category: FilterCategory) => {
    const cat = FILTER_CATEGORIES.find(c => c.id === category);
    return cat?.filters || [];
};
