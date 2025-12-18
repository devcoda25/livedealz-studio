export type SceneLayout = "full" | "split" | "pip" | "graphic_only";
export type SceneOverlay = "lower_third" | "hero" | "ticker" | "offer_card" | "none";

export interface ScenePreset {
    id: string;
    label: string;
    description: string;
    icon: string;
    layout: SceneLayout;
    overlay: SceneOverlay;
}

export const SCENE_PRESETS: ScenePreset[] = [
    {
        id: "intro_host",
        label: "Intro + host",
        description: "Single camera",
        icon: "person",
        layout: "full",
        overlay: "none"
    },
    {
        id: "single_cam",
        label: "Single camera",
        description: "Standard view",
        icon: "videocam",
        layout: "full",
        overlay: "none"
    },
    {
        id: "product_closeup",
        label: "Product close-up",
        description: "Hero overlay",
        icon: "featured_video",
        layout: "full",
        overlay: "hero"
    },
    {
        id: "split_screen",
        label: "Split screen",
        description: "Host + product",
        icon: "vertical_split",
        layout: "split",
        overlay: "none"
    },
    {
        id: "hero_overlay",
        label: "Hero overlay",
        description: "Featured item",
        icon: "badge",
        layout: "full",
        overlay: "hero"
    },
    {
        id: "flash_offer",
        label: "Flash offer",
        description: "High urgency",
        icon: "bolt",
        layout: "full",
        overlay: "offer_card"
    },
    {
        id: "offer_graphic",
        label: "Offer graphic",
        description: "Graphic only",
        icon: "image",
        layout: "graphic_only",
        overlay: "none"
    },
];

export class SceneEngine {
    static getById(id: string): ScenePreset | undefined {
        return SCENE_PRESETS.find(s => s.id === id);
    }

    static getAll(): ScenePreset[] {
        return SCENE_PRESETS;
    }
}
