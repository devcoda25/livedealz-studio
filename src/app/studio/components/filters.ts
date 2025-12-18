import { FilterCategory } from "./types";

export const FILTER_CATEGORIES: FilterCategory[] = [
    {
        id: "beauty",
        label: "Beauty",
        filters: [
            { label: "None", style: "none", icon: "block" },
            { label: "Soft Glam", style: "url(#filter-beauty-soft) contrast(1.05)", icon: "face_retouching_natural" },
            { label: "Radiance", style: "url(#filter-beauty-glam) brightness(1.1)", icon: "flare" },
            { label: "Porcelain", style: "brightness(1.1) contrast(0.9) saturate(0.9)", icon: "face" },
        ]
    },
    {
        id: "mood",
        label: "Mood",
        filters: [
            { label: "Warmth", style: "sepia(0.4) saturate(1.4) brightness(0.9)", icon: "wb_sunny" },
            { label: "Cool", style: "hue-rotate(180deg) opacity(0.9) brightness(1.1) saturate(0.8)", icon: "ac_unit" },
            { label: "Noir", style: "grayscale(1) contrast(1.2) brightness(0.9)", icon: "filter_b_and_w" },
            { label: "Dramatic", style: "contrast(1.4) brightness(0.9) saturate(1.2)", icon: "theaters" },
        ]
    },
    {
        id: "fun",
        label: "Fun",
        filters: [
            { label: "Neon", style: "hue-rotate(320deg) contrast(1.5) saturate(2)", icon: "bolt" },
            { label: "Pixel", style: "contrast(2) brightness(1.5) saturate(0)", icon: "grid_4x4" }, // CSS can't do real pixelate easily without SVG/Canvas, using fake high-contrast
            { label: "Invert", style: "invert(1)", icon: "swap_horiz" },
        ]
    },
    {
        id: "background",
        label: "BG",
        filters: [
            { label: "Blur Lite", style: "blur(2px)", icon: "blur_on" }, // Simulates background blur (whole video)
            { label: "Dim", style: "brightness(0.6)", icon: "dark_mode" },
        ]
    },
];

export const getFilterStyle = (name: string) => {
    for (const cat of FILTER_CATEGORIES) {
        const found = cat.filters.find(f => f.label === name);
        if (found) return found.style;
    }
    return "none";
};
