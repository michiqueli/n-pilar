import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generatePalette, EXAMPLE_PALETTES } from '@/lib/palette';
import config from '@/config';

const ThemeContext = createContext();

const STORAGE_KEY_PALETTE = 'npilar-palette-id';
const STORAGE_KEY_CUSTOM = 'npilar-custom-colors';
const STORAGE_KEY_MODE = 'npilar-theme-mode';

// Genera los valores CSS a partir de un palette ID o colores custom
function buildPaletteColors(paletteId, customColors) {
  if (paletteId === 'custom' && customColors && customColors.length === 5) {
    return generatePalette(customColors);
  }
  const example = EXAMPLE_PALETTES[paletteId];
  if (example) {
    return generatePalette(example.colors);
  }
  return generatePalette(EXAMPLE_PALETTES.default.colors);
}

function applyColors(paletteColors, mode) {
  if (!paletteColors) return;
  const colors = mode === 'dark' ? paletteColors.dark : paletteColors.light;
  if (!colors) return;
  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const ThemeProvider = ({ children }) => {
  const [paletteId, setPaletteIdState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PALETTE) || config.defaultPalette || 'default';
  });

  const [customColors, setCustomColorsState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM);
      return saved ? JSON.parse(saved) : ['#1F2937', '#374151', '#D1D5DB', '#E5E7EB', '#F3F4F6'];
    } catch {
      return ['#1F2937', '#374151', '#D1D5DB', '#E5E7EB', '#F3F4F6'];
    }
  });

  const [mode, setModeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_MODE) || 'light';
  });

  const applyCurrentTheme = useCallback(() => {
    const colors = buildPaletteColors(paletteId, customColors);
    applyColors(colors, mode);
  }, [paletteId, customColors, mode]);

  useEffect(() => {
    applyCurrentTheme();
  }, [applyCurrentTheme]);

  const setPalette = (id) => {
    localStorage.setItem(STORAGE_KEY_PALETTE, id);
    setPaletteIdState(id);
  };

  const setCustomColors = (colors) => {
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(colors));
    setCustomColorsState(colors);
    localStorage.setItem(STORAGE_KEY_PALETTE, 'custom');
    setPaletteIdState('custom');
  };

  const setMode = (newMode) => {
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
    setModeState(newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{
      paletteId,
      setPalette,
      customColors,
      setCustomColors,
      mode,
      setMode,
      toggleMode,
      examplePalettes: EXAMPLE_PALETTES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
