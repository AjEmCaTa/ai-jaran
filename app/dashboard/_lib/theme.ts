export type Surface = "midnight" | "graphite";
export type Radius = "sharp" | "soft" | "round";
export type Density = "compact" | "comfortable";

export type ThemeSettings = {
  accent: string;
  surface: Surface;
  radius: Radius;
  density: Density;
};

export const DEFAULT_THEME: ThemeSettings = {
  accent: "#3b82f6",
  surface: "midnight",
  radius: "soft",
  density: "comfortable",
};

export const ACCENTS = [
  { name: "Safir", hex: "#3b82f6" },
  { name: "Tirkiz", hex: "#06b6d4" },
  { name: "Smaragd", hex: "#10b981" },
  { name: "Zlato", hex: "#d4a017" },
  { name: "Koral", hex: "#f97316" },
  { name: "Ruža", hex: "#ec4899" },
  { name: "Ametist", hex: "#8b5cf6" },
];

const STORAGE_KEY = "poslo-theme";
export const THEME_EVENT = "poslo-theme-change";

const SURFACES: Record<Surface, Record<string, string>> = {
  midnight: {
    "--color-gray-950": "#04060c",
    "--color-gray-900": "#0a0e18",
    "--color-gray-800": "#182033",
    "--color-gray-700": "#263149",
  },
  graphite: {
    "--color-gray-950": "#09090b",
    "--color-gray-900": "#131316",
    "--color-gray-800": "#25252b",
    "--color-gray-700": "#35353d",
  },
};

const RADII: Record<Radius, string> = { sharp: "6px", soft: "14px", round: "24px" };
const PADS: Record<Density, string> = { compact: "14px", comfortable: "22px" };

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const hsl = (h: number, s: number, l: number) => `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%)`;

/**
 * Tailwind v4 čita boje iz CSS varijabli (--color-blue-500 itd.), pa
 * postavljanjem ovih varijabli na wrapper cijeli dashboard (i stare stranice
 * koje koriste "blue-*" klase) automatski dobiju odabranu boju.
 */
export function themeVars(theme: ThemeSettings): Record<string, string> {
  const accent = /^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : DEFAULT_THEME.accent;
  const [h, s, l] = hexToHsl(accent);
  return {
    "--color-blue-300": hsl(h, s, clamp(l + 20, 0, 85)),
    "--color-blue-400": hsl(h, s, clamp(l + 10, 0, 78)),
    "--color-blue-500": accent,
    "--color-blue-600": hsl(h, s, clamp(l - 7, 8, 100)),
    "--color-blue-700": hsl(h, s, clamp(l - 15, 6, 100)),
    "--color-blue-800": hsl(h, s, clamp(l - 24, 5, 100)),
    "--color-blue-900": hsl(h, s * 0.8, clamp(l - 30, 4, 100)),
    "--color-blue-950": hsl(h, s * 0.6, 12),
    ...SURFACES[theme.surface],
    "--po-radius": RADII[theme.radius],
    "--po-pad": PADS[theme.density],
  };
}

export function loadTheme(): ThemeSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: ThemeSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    /* privatni mod: tema važi samo do zatvaranja taba */
  }
  window.dispatchEvent(new CustomEvent<ThemeSettings>(THEME_EVENT, { detail: theme }));
}