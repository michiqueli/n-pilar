/**
 * Generador de paleta CSS completa a partir de 5 colores hex.
 *
 * Estrategia:
 * - Encuentra el color con más "personalidad" (más saturado) → primary
 * - Los más claros → fondos, cards
 * - Los intermedios → secondary, borders
 * - Genera foreground oscuro y dark mode automáticamente
 * - Respeta los colores originales en vez de inventar nuevos
 */

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hsl(obj) { return `${obj.h} ${obj.s}% ${obj.l}%`; }
function withL(obj, l) { return `${obj.h} ${obj.s}% ${l}%`; }
function withSL(obj, s, l) { return `${obj.h} ${s}% ${l}%`; }

function hexToHslObj(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function getLum(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function generatePalette(colors) {
  if (!colors || colors.length < 5) return null;

  const parsed = colors.map(hex => ({
    hex, lum: getLum(hex), hsl: hexToHslObj(hex),
  }));

  // Ordenar por luminosidad (oscuro → claro)
  const byLum = [...parsed].sort((a, b) => a.lum - b.lum);
  // El más saturado = el que tiene más "personalidad" → será nuestro primary
  const bySat = [...parsed].sort((a, b) => b.hsl.s - a.hsl.s);
  const accent = bySat[0]; // color con más carácter

  const allLight = byLum[0].lum > 0.6;
  const allDark = byLum[4].lum < 0.35;

  // === LIGHT MODE ===

  let primaryHsl, fgHsl, bgHsl, cardHsl, secHsl, borderHsl;

  if (allLight) {
    // Paleta toda clara (ej: rosas, pasteles)
    // Primary: el color con personalidad, bajado un poco para que funcione como botón
    const accentL = Math.min(accent.hsl.l, 75); // un poco más saturado/oscuro
    primaryHsl = { h: accent.hsl.h, s: Math.max(accent.hsl.s, 40), l: accentL };
    // Foreground: gris oscuro con tinte del accent
    fgHsl = { h: accent.hsl.h, s: 10, l: 20 };
    // Background: el color más claro
    bgHsl = byLum[4].hsl;
    // Card: segundo más claro
    cardHsl = byLum[3].hsl;
    // Secondary: el del medio
    secHsl = byLum[2].hsl;
    // Border: el segundo más oscuro (que sigue siendo claro)
    borderHsl = byLum[1].hsl;
  } else if (allDark) {
    // Paleta toda oscura
    primaryHsl = byLum[0].hsl;
    fgHsl = { h: accent.hsl.h, s: 5, l: 92 };
    bgHsl = { h: accent.hsl.h, s: 8, l: 96 };
    cardHsl = { h: accent.hsl.h, s: 5, l: 99 };
    secHsl = byLum[3].hsl;
    borderHsl = { h: accent.hsl.h, s: 8, l: 85 };
  } else {
    // Paleta mixta (tiene oscuros y claros)
    primaryHsl = byLum[0].hsl;
    fgHsl = byLum[0].hsl;
    bgHsl = { ...byLum[4].hsl, l: Math.min(byLum[4].hsl.l + 2, 98) };
    cardHsl = byLum[4].hsl;
    secHsl = byLum[3].hsl;
    borderHsl = byLum[2].hsl;
  }

  // Si primary es muy claro (>70), el texto encima es oscuro; si no, blanco
  const primaryFg = primaryHsl.l > 65 ? `${primaryHsl.h} 15% 15%` : '0 0% 100%';

  const light = {
    background: hsl(bgHsl),
    foreground: hsl(fgHsl),
    card: hsl(cardHsl),
    'card-foreground': hsl(fgHsl),
    popover: hsl(cardHsl),
    'popover-foreground': hsl(fgHsl),
    primary: hsl(primaryHsl),
    'primary-foreground': primaryFg,
    secondary: hsl(secHsl),
    'secondary-foreground': hsl(fgHsl),
    muted: hsl(secHsl),
    'muted-foreground': withL(fgHsl, 45),
    accent: hsl(secHsl),
    'accent-foreground': hsl(primaryHsl),
    destructive: '0 84% 60%',
    'destructive-foreground': '0 0% 100%',
    success: '145 63% 42%',
    warning: '45 93% 47%',
    info: withSL(accent.hsl, Math.min(accent.hsl.s + 10, 80), 50),
    border: withL(borderHsl, Math.max(borderHsl.l, 80)),
    input: hsl(cardHsl),
    ring: hsl(primaryHsl),
  };

  // === DARK MODE ===
  // Fondo oscuro con el tono del accent, los colores originales como acentos

  const darkBgH = accent.hsl.h;
  const darkBgS = Math.min(accent.hsl.s, 20);

  const dark = {
    background: `${darkBgH} ${darkBgS}% 10%`,
    foreground: hsl(bgHsl),
    card: `${darkBgH} ${darkBgS}% 14%`,
    'card-foreground': hsl(bgHsl),
    popover: `${darkBgH} ${darkBgS}% 14%`,
    'popover-foreground': hsl(bgHsl),
    // Primary en dark: usa el color accent original (el rosa, el azul, etc.)
    primary: hsl(accent.hsl),
    'primary-foreground': `${darkBgH} ${darkBgS}% 10%`,
    secondary: `${darkBgH} ${darkBgS}% 20%`,
    'secondary-foreground': hsl(bgHsl),
    muted: `${darkBgH} ${darkBgS}% 20%`,
    'muted-foreground': `${darkBgH} ${Math.min(darkBgS, 10)}% 60%`,
    accent: `${darkBgH} ${darkBgS}% 20%`,
    'accent-foreground': hsl(accent.hsl),
    border: `${darkBgH} ${darkBgS}% 22%`,
    input: `${darkBgH} ${darkBgS}% 14%`,
    ring: hsl(accent.hsl),
  };

  return { light, dark };
}

/**
 * Paletas de ejemplo con sus 5 colores hex base.
 */
export const EXAMPLE_PALETTES = {
  default: {
    name: 'Clásico',
    colors: ['#1F2937', '#374151', '#D1D5DB', '#E5E7EB', '#F3F4F6'],
  },
  rose: {
    name: 'Rosa Elegante',
    colors: ['#ffcac8', '#fedbd9', '#fffaf4', '#f9ffff', '#fffcf5'],
  },
  ocean: {
    name: 'Azul Océano',
    colors: ['#1a3a5c', '#2563a0', '#a8c8e8', '#d6e4f0', '#edf2f7'],
  },
  forest: {
    name: 'Verde Bosque',
    colors: ['#1b4332', '#2d6a4f', '#95d5b2', '#d8f3dc', '#f0faf4'],
  },
  sunset: {
    name: 'Atardecer',
    colors: ['#7c2d12', '#c2410c', '#fed7aa', '#ffedd5', '#fff7ed'],
  },
  lavender: {
    name: 'Lavanda',
    colors: ['#4c1d95', '#7c3aed', '#c4b5fd', '#ddd6fe', '#f5f3ff'],
  },
  minimal: {
    name: 'Minimalista',
    colors: ['#171717', '#404040', '#a3a3a3', '#e5e5e5', '#f5f5f5'],
  },
};
