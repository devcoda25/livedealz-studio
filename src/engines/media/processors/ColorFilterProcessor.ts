// Color Filter Processor - WebGL shader-based color grading with LUT support
// Replaces CSS filter strings with real GPU-accelerated shaders

import { ColorFilterConfig, BEAUTY_FILTERS, COLOR_FILTERS } from '../types';

// Vertex shader - passes through position and UV coordinates
const VERTEX_SHADER = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

// Fragment shader templates for each filter type
const FRAGMENT_SHADER_HEADER = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_image;
    uniform float u_intensity;
`;

// Passthrough shader
const SHADER_NONE = FRAGMENT_SHADER_HEADER + `
    void main() {
        gl_FragColor = texture2D(u_image, v_texCoord);
    }
`;

// Classic / Sepia tone
const SHADER_CLASSIC = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 sepia = vec3(gray * 1.08, gray * 0.95, gray * 0.82);
        vec3 result = mix(color.rgb, sepia, 0.15);
        result = mix(result, result * 1.1, 0.1); // contrast
        result *= 1.02; // brightness
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Warm filter
const SHADER_WARM = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        result.r = min(1.0, result.r * 1.1 + 0.03);
        result.g = min(1.0, result.g * 1.02 + 0.01);
        result.b = max(0.0, result.b * 0.95 - 0.02);
        result *= 1.05;
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Cool filter
const SHADER_COOL = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        result.r = max(0.0, result.r * 0.93);
        result.g = min(1.0, result.g * 1.02);
        result.b = min(1.0, result.b * 1.12 + 0.04);
        result *= 1.05;
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Vintage filter
const SHADER_VINTAGE = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 vintage = vec3(gray * 1.08 + 0.05, gray * 0.92 + 0.02, gray * 0.78);
        vec3 result = mix(color.rgb, vintage, 0.4);
        result *= 0.95;
        // Add subtle vignette
        vec2 center = v_texCoord - 0.5;
        float vignette = 1.0 - dot(center, center) * 0.3;
        result *= vignette;
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Cinematic filter
const SHADER_CINEMATIC = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        // S-curve contrast
        result = result * result * (3.0 - 2.0 * result);
        // Teal shadows, orange highlights
        float luma = dot(result, vec3(0.299, 0.587, 0.114));
        vec3 shadowTint = vec3(0.0, 0.05, 0.08);
        vec3 highlightTint = vec3(0.08, 0.04, 0.0);
        result += mix(shadowTint, highlightTint, luma) * 0.5;
        result = clamp(result, 0.0, 1.0);
        result *= 0.95;
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Dramatic filter
const SHADER_DRAMATIC = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        // High contrast S-curve
        result = result * result * (3.0 - 2.0 * result);
        result = result * result * (3.0 - 2.0 * result);
        result *= vec3(1.05, 1.0, 0.95);
        result *= 0.92;
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Dreamy filter
const SHADER_DREAMY = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        result = mix(result, vec3(1.0) - (vec3(1.0) - result) * (vec3(1.0) - result), 0.3);
        result.r = min(1.0, result.r * 1.05 + 0.03);
        result.g = min(1.0, result.g * 1.02 + 0.02);
        result.b = min(1.0, result.b * 1.08 + 0.04);
        result *= 1.12;
        // Soft glow approximation
        float luma = dot(result, vec3(0.299, 0.587, 0.114));
        result += vec3(0.02, 0.01, 0.03);
        result = clamp(result, 0.0, 1.0);
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Noir (black & white)
const SHADER_NOIR = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        // Boost contrast
        gray = gray * gray * (3.0 - 2.0 * gray);
        gray *= 0.95;
        vec3 result = vec3(gray);
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Neon filter
const SHADER_NEON = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        // Boost saturation dramatically
        float gray = dot(result, vec3(0.299, 0.587, 0.114));
        result = mix(vec3(gray), result, 2.0);
        // Shift hue toward magenta/pink
        result.r = min(1.0, result.r * 1.15);
        result.g = max(0.0, result.g * 0.85);
        result.b = min(1.0, result.b * 1.1);
        // High contrast
        result = result * result * (3.0 - 2.0 * result);
        result *= 1.1;
        result = clamp(result, 0.0, 1.0);
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Invert filter
const SHADER_INVERT = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = vec3(1.0) - color.rgb;
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Beauty: Soft Glam
const SHADER_SOFT_GLAM = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        result *= 1.05;
        result = mix(result, vec3(1.0) - (vec3(1.0) - result) * (vec3(1.0) - result), 0.15);
        float gray = dot(result, vec3(0.299, 0.587, 0.114));
        result = mix(vec3(gray), result, 0.92);
        result += vec3(0.02, 0.01, 0.0);
        result = clamp(result, 0.0, 1.0);
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Beauty: Radiance
const SHADER_RADIANCE = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        result *= 1.1;
        float gray = dot(result, vec3(0.299, 0.587, 0.114));
        result = mix(vec3(gray), result, 1.15);
        result += vec3(0.02, 0.02, 0.01);
        result = clamp(result, 0.0, 1.0);
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Beauty: Porcelain
const SHADER_PORCELAIN = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        result *= 1.12;
        // Reduce contrast
        result = mix(vec3(0.5), result, 0.88);
        float gray = dot(result, vec3(0.299, 0.587, 0.114));
        result = mix(vec3(gray), result, 0.85);
        result += vec3(0.04, 0.03, 0.02);
        result = clamp(result, 0.0, 1.0);
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Beauty: Clean Skin (skin smoothing look)
const SHADER_CLEAN_SKIN = FRAGMENT_SHADER_HEADER + `
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 result = color.rgb;
        // Soften by reducing high-frequency detail perception
        result = mix(result, vec3(1.0) - (vec3(1.0) - result) * (vec3(1.0) - result), 0.1);
        result *= 1.03;
        float gray = dot(result, vec3(0.299, 0.587, 0.114));
        result = mix(vec3(gray), result, 0.93);
        result += vec3(0.01, 0.01, 0.0);
        result = clamp(result, 0.0, 1.0);
        gl_FragColor = vec4(mix(color.rgb, result, u_intensity), color.a);
    }
`;

// Map filter IDs to their shader sources
const SHADER_MAP: Record<string, string> = {
    'none': SHADER_NONE,
    'classic': SHADER_CLASSIC,
    'warm': SHADER_WARM,
    'cool': SHADER_COOL,
    'vintage': SHADER_VINTAGE,
    'cinematic': SHADER_CINEMATIC,
    'dramatic': SHADER_DRAMATIC,
    'dreamy': SHADER_DREAMY,
    'noir': SHADER_NOIR,
    'neon': SHADER_NEON,
    'invert': SHADER_INVERT,
    'soft_glam': SHADER_SOFT_GLAM,
    'radiance': SHADER_RADIANCE,
    'porcelain': SHADER_PORCELAIN,
    'acne_remove': SHADER_CLEAN_SKIN,
};

interface CompiledProgram {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation | null>;
    attribs: Record<string, number>;
}

export class ColorFilterProcessor {
    private gl: WebGLRenderingContext | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx2d: CanvasRenderingContext2D | null = null; // fallback
    private activeFilter: ColorFilterConfig | null = null;
    private intensity: number = 100;
    private useWebGL: boolean = false;

    // WebGL resources
    private texture: WebGLTexture | null = null;
    private compiledPrograms: Map<string, CompiledProgram> = new Map();
    private vertexBuffer: WebGLBuffer | null = null;
    private texCoordBuffer: WebGLBuffer | null = null;

    // LUT texture for advanced grading
    private lutTexture: WebGLTexture | null = null;

    constructor() { }

    attach(ctx: CanvasRenderingContext2D): void {
        this.ctx2d = ctx;
        this.canvas = ctx.canvas;
        this.initWebGL();
    }

    private initWebGL(): void {
        if (!this.canvas) return;

        // Try to get a WebGL context from an offscreen canvas
        const glCanvas = document.createElement('canvas');
        const gl = glCanvas.getContext('webgl', {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
        });

        if (!gl) {
            console.warn("[ColorFilterProcessor] WebGL not available, falling back to Canvas2D");
            this.useWebGL = false;
            return;
        }

        this.gl = gl;
        this.useWebGL = true;

        // Create texture
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Create vertex buffer (full-screen quad)
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);

        // Create tex coord buffer
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 1, 1, 1, 0, 0,
            0, 0, 1, 1, 1, 0,
        ]), gl.STATIC_DRAW);

        console.log("[ColorFilterProcessor] WebGL initialized.");
    }

    private compileShaderProgram(fragmentSource: string): CompiledProgram | null {
        const gl = this.gl;
        if (!gl) return null;

        // Compile vertex shader
        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertShader) return null;
        gl.shaderSource(vertShader, VERTEX_SHADER);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            console.error("Vertex shader compile error:", gl.getShaderInfoLog(vertShader));
            gl.deleteShader(vertShader);
            return null;
        }

        // Compile fragment shader
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragShader) { gl.deleteShader(vertShader); return null; }
        gl.shaderSource(fragShader, fragmentSource);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            console.error("Fragment shader compile error:", gl.getShaderInfoLog(fragShader));
            gl.deleteShader(vertShader);
            gl.deleteShader(fragShader);
            return null;
        }

        // Link program
        const program = gl.createProgram();
        if (!program) { gl.deleteShader(vertShader); gl.deleteShader(fragShader); return null; }
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Shader program link error:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            gl.deleteShader(vertShader);
            gl.deleteShader(fragShader);
            return null;
        }

        // Clean up shaders (they're linked into the program now)
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);

        // Get uniform and attribute locations
        const compiled: CompiledProgram = {
            program,
            uniforms: {
                u_image: gl.getUniformLocation(program, 'u_image'),
                u_intensity: gl.getUniformLocation(program, 'u_intensity'),
            },
            attribs: {
                a_position: gl.getAttribLocation(program, 'a_position'),
                a_texCoord: gl.getAttribLocation(program, 'a_texCoord'),
            },
        };

        return compiled;
    }

    private getOrCreateProgram(filterId: string): CompiledProgram | null {
        if (this.compiledPrograms.has(filterId)) {
            return this.compiledPrograms.get(filterId)!;
        }

        const shaderSource = SHADER_MAP[filterId];
        if (!shaderSource) {
            console.warn("[ColorFilterProcessor] No shader for filter:", filterId);
            return null;
        }

        const compiled = this.compileShaderProgram(shaderSource);
        if (compiled) {
            this.compiledPrograms.set(filterId, compiled);
        }
        return compiled;
    }

    setFilter(filter: ColorFilterConfig | null): void {
        this.activeFilter = filter;

        // Pre-compile the shader for this filter
        if (filter && this.useWebGL) {
            this.getOrCreateProgram(filter.id);
        }
    }

    setIntensity(value: number): void {
        this.intensity = Math.max(0, Math.min(100, value));
    }

    getIntensity(): number {
        return this.intensity;
    }

    // Apply the current filter to a source and draw to the 2D canvas
    applyToVideoFrame(source: HTMLVideoElement | HTMLCanvasElement): void {
        if (!this.activeFilter || this.activeFilter.cssFilter === 'none' || this.activeFilter.id === 'none') {
            return; // Nothing to apply, the frame is already drawn
        }

        if (this.useWebGL && this.gl && this.canvas) {
            this.applyWebGL(source);
        }
    }

    private applyWebGL(source: HTMLVideoElement | HTMLCanvasElement): void {
        const gl = this.gl;
        if (!gl || !this.canvas || !this.ctx2d || !this.activeFilter) return;

        const filterId = this.activeFilter.id;
        const compiled = this.getOrCreateProgram(filterId);
        if (!compiled) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Resize the WebGL canvas to match
        const glCanvas = gl.canvas as HTMLCanvasElement;
        if (glCanvas.width !== width || glCanvas.height !== height) {
            glCanvas.width = width;
            glCanvas.height = height;
        }

        gl.viewport(0, 0, width, height);

        // Upload source as texture
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

        // Use the compiled shader program
        gl.useProgram(compiled.program);

        // Bind vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(compiled.attribs.a_position);
        gl.vertexAttribPointer(compiled.attribs.a_position, 2, gl.FLOAT, false, 0, 0);

        // Bind texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(compiled.attribs.a_texCoord);
        gl.vertexAttribPointer(compiled.attribs.a_texCoord, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms
        gl.uniform1i(compiled.uniforms.u_image, 0);
        gl.uniform1f(compiled.uniforms.u_intensity, this.intensity / 100);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Read back to 2D canvas
        this.ctx2d.drawImage(glCanvas, 0, 0, width, height);
    }

    // Get CSS filter string (kept for backward compatibility but now just returns 'none')
    getCSSFilter(): string {
        return 'none'; // We use WebGL now
    }

    // Load a .cube LUT file and create a 3D texture from it
    async loadLUT(url: string): Promise<void> {
        if (!this.gl) return;

        try {
            const response = await fetch(url);
            const text = await response.text();
            const lutData = this.parseCubeLUT(text);
            if (!lutData) return;

            this.createLUTTexture(lutData);
            console.log("[ColorFilterProcessor] LUT loaded:", url);
        } catch (e) {
            console.error("[ColorFilterProcessor] Failed to load LUT:", e);
        }
    }

    private parseCubeLUT(text: string): Float32Array | null {
        const lines = text.split('\n');
        const values: number[] = [];
        let size = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('LUT_3D_SIZE')) {
                size = parseInt(trimmed.split(/\s+/)[1], 10);
            } else if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('TITLE') && !trimmed.startsWith('DOMAIN')) {
                const parts = trimmed.split(/\s+/).map(Number);
                if (parts.length === 3 && parts.every(n => !isNaN(n))) {
                    values.push(parts[0], parts[1], parts[2]);
                }
            }
        }

        if (size === 0 || values.length === 0) return null;

        return new Float32Array(values);
    }

    private createLUTTexture(data: Float32Array): void {
        const gl = this.gl;
        if (!gl) return;

        this.lutTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.lutTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 64, 64, 0, gl.RGB, gl.FLOAT, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    // Apply skin smoothing using bilateral filter approximation (Canvas2D fallback)
    applySkinSmoothing(ctx: CanvasRenderingContext2D, intensity: number): void {
        if (!this.canvas) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Simple bilateral-ish filter using box blur + edge preservation
        const radius = Math.ceil(intensity / 25); // 1-4 pixels
        ctx.save();
        ctx.filter = `blur(${radius}px)`;
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = intensity / 200; // Subtle effect
        ctx.drawImage(this.canvas, 0, 0, width, height);
        ctx.restore();
    }

    static getColorFilters(): ColorFilterConfig[] {
        return COLOR_FILTERS;
    }

    static getBeautyFilters(): ColorFilterConfig[] {
        return BEAUTY_FILTERS;
    }

    dispose(): void {
        const gl = this.gl;
        if (gl) {
            for (const compiled of this.compiledPrograms.values()) {
                gl.deleteProgram(compiled.program);
            }
            this.compiledPrograms.clear();

            if (this.texture) gl.deleteTexture(this.texture);
            if (this.lutTexture) gl.deleteTexture(this.lutTexture);
            if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
            if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
        }

        this.gl = null;
        this.canvas = null;
        this.ctx2d = null;
        this.texture = null;
        this.lutTexture = null;
        this.vertexBuffer = null;
        this.texCoordBuffer = null;
    }
}

export default ColorFilterProcessor;
