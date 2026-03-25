# Promo Cut - Video Editor Architecture Plan

## 1. Executive Summary

Promo Cut is a **professional CapCut-like video editing module** within Live Studio Pro that enables sellers and creators to:
- Create promo videos with professional effects
- Build simple animations for products
- Apply preset effects to videos
- Use template-based video creation
- Export videos for use in live streams or seller platform

### Key Features:
1. **Full Video Editor** - Timeline-based editing with multiple tracks
2. **Quick Promo Tools** - Simple trimming with preset effects
3. **Template System** - Pre-built video templates with product integration
4. **Professional Filters** - CapCut-quality filters built into Promo Cut

### Integration Strategy:
- **Replace FilterEngine** - Move all filter functionality to Promo Cut
- **Studio Presets** - Load Promo Cut filters as presets in main studio
- **Scene Integration** - Import Promo Cut videos directly into Scene Composer

---

## 2. Core Capabilities

### 2.1 Video Import & Management
- Import videos from device (MP4, MOV, WebM)
- Import from URL/cloud storage
- Video metadata display (duration, resolution, size)
- Thumbnail generation for timeline

### 2.2 Timeline Editor
- **Multi-track Timeline**
  - Video track (main content)
  - Audio track (background music, voiceover)
  - Text/Overlay track
  - Effect track
- **Timeline Controls**
  - Playhead scrubbing
  - Zoom in/out
  - Snap to grid
  - Split at playhead
  - Delete selected

### 2.3 Video Effects
- **Filters** - CapCut-quality professional filters
  - Color correction (brightness, contrast, saturation, warmth)
  - Style filters (vintage, cinematic, noir, vibrant)
  - Beauty filters (skin smooth, face retouch)
  - Background blur (portrait mode)
  - Green screen/chroma key
  - Custom LUT support
- **Transitions**
  - Fade in/out
  - Slide (multiple directions)
  - Wipe
  - Zoom
  - Spin
- **Animated Effects**
  - Text animations (typewriter, fade, slide)
  - Sticker animations
  - Product highlight effects
  - Call-to-action animations
  - Particle effects

### 2.4 Professional Filter System (CapCut Quality)

```typescript
interface PromoCutFilter {
  id: string;
  name: string;
  category: 'color' | 'style' | 'beauty' | 'effect';
  
  // Preview
  thumbnailUrl: string;
  previewVideoUrl?: string;
  
  // Filter Parameters (CSS-like + Custom)
  adjustments: FilterAdjustment[];
  
  // LUT Support
  lutUrl?: string;
  lutStrength: number;
  
  // AI Enhancement
  aiEnhanced: boolean;
  aiModel?: string;
}

interface FilterAdjustment {
  type: 'brightness' | 'contrast' | 'saturation' | 'warmth' | 'tint' | 'sharpness' | 'blur' | 'vignette';
  value: number;
  min: number;
  max: number;
}
```

**Filter Categories:**
- **Essential** - Basic color adjustments
- **Portrait** - Skin smoothing, face effects
- **Vibe** - Stylish looks (like CapCut popular filters)
- **Food** - Food-specific enhancements
- **Travel** - Landscape/vacation filters
- **Retro** - Vintage and nostalgic looks
- **Cinema** - Cinematic color grading
- **Custom** - User-created filters

### 2.4 Text & Overlays
- Text overlays with customization:
  - Fonts (Google Fonts integration)
  - Colors
  - Sizes
  - Animations
  - Position on canvas
- Product showcases
- Price tags
- CTA buttons

### 2.5 Quick Promo Mode
- Simplified interface for quick edits
- Preset templates:
  - "Flash Sale" - Quick urgency promo
  - "Product Reveal" - Unboxing style
  - "Testimonial" - Customer review
  - "Feature Highlight" - Key benefits
- One-tap effect application

### 2.6 Template System
- **Built-in Templates**
  - Seasonal (Black Friday, Holiday, etc.)
  - Product launch
  - Sale announcement
  - Tutorial
- **Custom Templates**
  - Save current project as template
  - Share templates
  - Template categories
- **Product Integration**
  - Auto-populate product info
  - Dynamic pricing updates
  - Product image gallery

### 2.7 Export Options
- **Resolution Options**
  - 1080p (1920x1080)
  - 720p (1280x720)
  - Vertical (1080x1920)
  - Square (1080x1080)
- **Format Options**
  - MP4 (H.264)
  - WebM
- **Quality Presets**
  - High (for upload)
  - Medium (for streaming)
  - Low (for preview)

---

## 3. Data Models

### 3.1 Project

```typescript
interface VideoProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  
  // Settings
  settings: ProjectSettings;
  
  // Tracks
  tracks: Track[];
  
  // Timeline
  duration: number; // milliseconds
  currentTime: number;
  
  // Export
  exportSettings?: ExportSettings;
}

interface ProjectSettings {
  resolution: Resolution;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  frameRate: 24 | 30 | 60;
  backgroundColor: string;
}
```

### 3.2 Tracks & Clips

```typescript
type TrackType = 'video' | 'audio' | 'text' | 'effect';

interface Track {
  id: string;
  type: TrackType;
  name: string;
  clips: Clip[];
  muted: boolean;
  locked: boolean;
}

interface Clip {
  id: string;
  trackId: string;
  
  // Timing
  startTime: number;  // position on timeline (ms)
  duration: number;    // clip length (ms)
  trimStart: number;   // trim from source start (ms)
  trimEnd: number;     // trim from source end (ms)
  
  // Source
  sourceId: string;
  sourceType: 'video' | 'image' | 'audio' | 'text' | 'effect';
  
  // Properties
  properties: ClipProperties;
  
  // Effects
  effects: ClipEffect[];
}

interface ClipProperties {
  volume?: number;
  opacity?: number;
  speed?: number;
  position?: { x: number; y: number };
  scale?: { x: number; y: number };
  rotation?: number;
  crop?: CropRect;
}
```

### 3.3 Effects & Transitions

```typescript
interface ClipEffect {
  id: string;
  type: 'filter' | 'transition' | 'animation';
  effectId: string;
  
  // Timing
  startTime: number;
  duration: number;
  
  // Parameters
  parameters: Record<string, any>;
}

interface FilterEffect {
  id: string;
  name: string;
  type: 'color' | 'beauty' | 'blur' | 'chroma';
  intensity: number;
  parameters: Record<string, any>;
}

interface Transition {
  id: string;
  type: 'fade' | 'slide' | 'wipe' | 'zoom';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

interface TextAnimation {
  id: string;
  type: 'typewriter' | 'fade' | 'slide' | 'bounce' | 'pulse';
  duration: number;
  delay: number;
}
```

### 3.4 Templates

```typescript
interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sale' | 'product' | 'tutorial' | 'testimonial' | 'custom';
  thumbnailUrl: string;
  
  // Template content
  project: Omit<VideoProject, 'id'>;
  
  // Placeholders
  placeholders: TemplatePlaceholder[];
  
  // Metadata
  isBuiltIn: boolean;
  isPremium: boolean;
  tags: string[];
}

interface TemplatePlaceholder {
  id: string;
  type: 'video' | 'image' | 'text' | 'product';
  name: string;
  defaultValue?: string;
  required: boolean;
}
```

### 2.8 Export Settings

```typescript
interface ExportSettings {
  format: 'mp4' | 'webm';
  resolution: Resolution;
  quality: 'high' | 'medium' | 'low';
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  
  // Export options
  includeWatermark: boolean;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  // Output
  outputFilename: string;
}
```

---

## 4. Component Architecture

### 4.1 Main Components

```
PromoCutEditor
├── VideoEditorLayout
│   ├── Header (Project name, Export button)
│   ├── Toolbar (Tools: Select, Cut, Text, Effects)
│   ├── PreviewCanvas (Video preview)
│   ├── TimelinePanel
│   │   ├── TimelineRuler
│   │   ├── TrackList
│   │   │   ├── VideoTrack
│   │   │   ├── AudioTrack
│   │   │   ├── TextTrack
│   │   │   └── EffectTrack
│   │   └── TimelineControls (Play, Pause, Zoom)
│   ├── PropertiesPanel (Clip properties)
│   ├── EffectsPanel (Filters, Transitions)
│   ├── MediaLibraryPanel (Imported files)
│   └── TemplateLibraryModal

QuickPromoMode
├── SimplifiedLayout
│   ├── TemplateSelector
│   ├── PreviewArea
│   ├── QuickEditor (Essential controls)
│   └── ExportButton
```

### 4.2 Key Components

#### VideoPreview
- Real-time canvas rendering
- Playback controls (play, pause, seek)
- Fullscreen preview
- Resolution toggle

#### Timeline
- Horizontal scrollable timeline
- Track visualization with clips
- Drag-and-drop clip arrangement
- Zoom controls
- Playhead with scrubbing

#### ClipEditor
- Trim handles (start/end)
- Split tool
- Copy/paste
- Delete

#### EffectsLibrary
- Filter categories
- Transition gallery
- Text animations
- Sticker packs

#### TemplateSelector
- Category browsing
- Preview thumbnails
- Placeholder mapping
- Instant preview

---

## 5. State Management

### 5.1 Project State

```typescript
interface PromoCutState {
  // Project
  currentProject: VideoProject | null;
  projects: VideoProject[];
  
  // Playback
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  
  // Selection
  selectedClipId: string | null;
  selectedTrackId: string | null;
  
  // UI
  zoomLevel: number;
  showGrid: boolean;
  activePanel: 'media' | 'effects' | 'templates' | 'properties';
  
  // Media
  importedMedia: MediaItem[];
  
  // Export
  isExporting: boolean;
  exportProgress: number;
}

interface MediaItem {
  id: string;
  type: 'video' | 'image' | 'audio';
  name: string;
  url: string;
  duration?: number;
  thumbnailUrl?: string;
  metadata: MediaMetadata;
}
```

---

## 6. Integration Points

### 6.1 Existing Systems - REPLACE & MIGRATE

| Component | Integration |
|-----------|-------------|
| **FilterEngine** | **DEPRECATED** - Replace with PromoCut Filters |
| FilterEngine | Reuse for video filters |
| CommerceEngine | Product data for templates |
| SceneComposer | Import scenes as video sources |
| MediaEngine | Video encoding/decoding |
| TemplateStorage | Save/load project templates |

### 6.2 Filter Preset Flow

```
Promo Cut Filters (Master)
       ↓
   [Export]
       ↓
Filter Presets JSON
       ↓
   Studio (Load)
       ↓
SceneComposer Filters
```

### 6.3 Browser APIs

- **WebCodecs API** - Video decoding/encoding
- **MediaRecorder API** - Export recording
- **Canvas API** - Frame rendering
- **Web Audio API** - Audio processing
- **WebGL** - Advanced GPU-accelerated filters

---

## 7. Implementation Phases

### Phase 1: Foundation & Professional Filters (Week 1-2)
- [ ] Project state management
- [ ] Video import (file input)
- [ ] Basic playback
- [ ] **Professional Filter System** (CapCut quality)
  - Filter data models
  - Filter categories (Essential, Portrait, Vibe, Cinema, etc.)
  - Filter adjustment controls
  - Preview thumbnails
- [ ] Filter preset export for Studio

### Phase 2: Core Editing & Timeline (Week 2-3)
- [ ] Multi-track timeline
- [ ] Clip trimming
- [ ] Drag-drop arrangement
- [ ] Split/delete operations
- [ ] Timeline UI with tracks

### Phase 3: Effects & Transitions (Week 3-4)
- [ ] Transitions between clips
- [ ] Text overlays with animations
- [ ] Sticker effects
- [ ] Keyframe animations

### Phase 4: Quick Promo & Templates (Week 4-5)
- [ ] Simplified Quick Promo mode
- [ ] Preset templates
- [ ] Template library
- [ ] Placeholder system

### Phase 5: Studio Integration & Export (Week 5-6)
- [ ] Export filters as Studio presets
- [ ] Integrate with SceneComposer
- [ ] Video encoding/export
- [ ] Download/share

### Phase 6: Polish & Performance (Week 6-7)
- [ ] UI polish
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Additional templates

---

## 8. Technical Considerations

### 8.1 Performance
- Use Web Workers for video processing
- Lazy load thumbnails
- Virtualized timeline for long videos
- Progressive rendering for preview

### 8.2 Browser Support
- Chrome 94+ (WebCodecs)
- Firefox 92+ (WebCodecs)
- Safari 15+ (limited WebCodecs)
- Fallback for older browsers

### 8.3 Storage
- IndexedDB for large video files
- LocalStorage for project metadata
- Cloud storage integration (future)

---

## 9. File Structure

```
src/
├── app/
│   └── promo-cut/
│       ├── page.tsx
│       └── components/
│           ├── PromoCutEditor.tsx
│           ├── VideoPreview.tsx
│           ├── Timeline.tsx
│           ├── Track.tsx
│           ├── Clip.tsx
│           ├── EffectsPanel.tsx
│           ├── MediaLibrary.tsx
│           ├── TemplateSelector.tsx
│           ├── QuickPromoMode.tsx
│           └── ExportDialog.tsx
├── engines/
│   └── video-editor/
│       ├── VideoProcessor.ts
│       ├── TimelineEngine.ts
│       ├── EffectsEngine.ts
│       ├── ExportEngine.ts
│       └── index.ts
└── types/
    └── promo-cut.ts
```

---

## 10. Success Metrics

- [ ] Import video files up to 500MB
- [ ] Timeline handles 10+ clips smoothly
- [ ] Export 1080p video in under 5 minutes
- [ ] Template system with 20+ built-in templates
- [ ] Quick Promo mode creates video in under 2 minutes
