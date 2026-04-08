export type RecordEffect = {
  id: string;
  name: string;
  icon: string; // material icon name
  gradient: string; // tailwind gradient classes without the `bg-gradient-to-br`
  cssFilter: (intensity: number) => string;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const t01 = (intensity: number) => clamp01(intensity / 100);

export const RECORD_EFFECTS: RecordEffect[] = [
  {
    id: "none",
    name: "Normal",
    icon: "radio_button_unchecked",
    gradient: "from-slate-700 to-slate-900",
    cssFilter: () => "none",
  },
  {
    id: "classic",
    name: "Classic",
    icon: "movie",
    gradient: "from-slate-600 to-slate-800",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const contrast = 1 + 0.15 * t;
      const sat = 1 + 0.08 * t;
      return `contrast(${contrast}) saturate(${sat})`;
    },
  },
  {
    id: "warm",
    name: "Warm",
    icon: "wb_sunny",
    gradient: "from-orange-400 to-rose-600",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const sat = 1 + 0.55 * t;
      const contrast = 1 + 0.12 * t;
      const bright = 1 + 0.06 * t;
      const sepia = 0.22 * t;
      const hue = 10 * t;
      return `saturate(${sat}) contrast(${contrast}) brightness(${bright}) sepia(${sepia}) hue-rotate(${hue}deg)`;
    },
  },
  {
    id: "cool",
    name: "Cool",
    icon: "ac_unit",
    gradient: "from-cyan-400 to-blue-600",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const sat = 1 + 0.45 * t;
      const contrast = 1 + 0.12 * t;
      const hue = -12 * t;
      return `saturate(${sat}) contrast(${contrast}) hue-rotate(${hue}deg)`;
    },
  },
  {
    id: "vintage",
    name: "Vintage",
    icon: "filter_vintage",
    gradient: "from-amber-600 to-yellow-900",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const sepia = 0.55 * t;
      const contrast = 1 + 0.08 * t;
      const sat = 1 - 0.15 * t;
      return `sepia(${sepia}) contrast(${contrast}) saturate(${sat})`;
    },
  },
  {
    id: "dreamy",
    name: "Dreamy",
    icon: "cloud",
    gradient: "from-pink-500 to-fuchsia-600",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const bright = 1 + 0.08 * t;
      const sat = 1 + 0.28 * t;
      return `brightness(${bright}) saturate(${sat}) blur(${0.8 * t}px)`;
    },
  },
  {
    id: "cinematic",
    name: "Cinematic",
    icon: "theaters",
    gradient: "from-indigo-600 to-slate-900",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const contrast = 1 + 0.22 * t;
      const sat = 1 - 0.08 * t;
      return `contrast(${contrast}) saturate(${sat})`;
    },
  },
  {
    id: "bw",
    name: "B&W",
    icon: "filter_b_and_w",
    gradient: "from-zinc-700 to-black",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const contrast = 1 + 0.25 * t;
      const bright = 1 - 0.06 * t;
      return `grayscale(1) contrast(${contrast}) brightness(${bright})`;
    },
  },
  {
    id: "vivid",
    name: "Vivid",
    icon: "palette",
    gradient: "from-violet-500 to-fuchsia-600",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const sat = 1 + 0.85 * t;
      const contrast = 1 + 0.15 * t;
      return `saturate(${sat}) contrast(${contrast})`;
    },
  },
  {
    id: "neon",
    name: "Neon",
    icon: "bolt",
    gradient: "from-fuchsia-500 to-cyan-400",
    cssFilter: (intensity) => {
      const t = t01(intensity);
      const sat = 1 + 1.0 * t;
      const contrast = 1 + 0.35 * t;
      return `saturate(${sat}) contrast(${contrast}) hue-rotate(${14 * t}deg)`;
    },
  },
];

export function getRecordEffect(id: string): RecordEffect | null {
  return RECORD_EFFECTS.find((e) => e.id === id) ?? null;
}

export function getRecordEffectCssFilter(id: string, intensity: number = 100): string {
  const effect = getRecordEffect(id);
  if (!effect) return "none";
  return effect.cssFilter(intensity);
}
