import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Sun, Moon, Palette, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import config from '@/config';
import { cn } from '@/lib/utils';

const Configuracion = () => {
  const { paletteId, setPalette, customColors, setCustomColors, mode, toggleMode, examplePalettes } = useTheme();

  // Estado local para editar colores custom
  const [editColors, setEditColors] = useState(customColors);
  const [colorInput, setColorInput] = useState('');

  const handleColorChange = (index, value) => {
    const newColors = [...editColors];
    newColors[index] = value;
    setEditColors(newColors);
  };

  const applyCustomColors = () => {
    // Validar que todos sean hex válidos
    const valid = editColors.every(c => /^#[0-9a-fA-F]{6}$/.test(c));
    if (valid) {
      setCustomColors(editColors);
    }
  };

  // Parsear input de texto con múltiples colores (separados por coma, espacio, etc.)
  const handleBulkImport = () => {
    const colors = colorInput
      .replace(/[,;|\s]+/g, ' ')
      .trim()
      .split(' ')
      .map(c => c.trim())
      .filter(c => /^#?[0-9a-fA-F]{6}$/.test(c))
      .map(c => c.startsWith('#') ? c : `#${c}`);

    if (colors.length >= 5) {
      const fiveColors = colors.slice(0, 5);
      setEditColors(fiveColors);
      setCustomColors(fiveColors);
      setColorInput('');
    }
  };

  return (
    <>
      <Helmet>
        <title>{`Configuración - ${config.appName}`}</title>
      </Helmet>

      <motion.div
        className="space-y-8 max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Personaliza la apariencia de tu aplicación.</p>
        </div>

        {/* Tema claro / oscuro */}
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            {mode === 'light' ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5 text-info" />}
            <h2 className="text-lg font-semibold text-foreground">Modo de visualización</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => mode !== 'light' && toggleMode()}
              className={cn(
                "premium-card p-4 flex flex-col items-center gap-3 cursor-pointer transition-all",
                mode === 'light' ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
              )}
            >
              <div className="w-full h-16 rounded-lg bg-[#F3F4F6] border flex items-center justify-center">
                <Sun className="w-6 h-6 text-[#374151]" />
              </div>
              <span className="text-sm font-medium text-foreground">Claro</span>
            </button>

            <button
              onClick={() => mode !== 'dark' && toggleMode()}
              className={cn(
                "premium-card p-4 flex flex-col items-center gap-3 cursor-pointer transition-all",
                mode === 'dark' ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
              )}
            >
              <div className="w-full h-16 rounded-lg bg-[#1F2937] border border-gray-600 flex items-center justify-center">
                <Moon className="w-6 h-6 text-[#E5E7EB]" />
              </div>
              <span className="text-sm font-medium text-foreground">Oscuro</span>
            </button>
          </div>
        </div>

        {/* Paletas predefinidas */}
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Paleta de colores</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Elige una paleta predefinida o crea la tuya con colores personalizados.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(examplePalettes).map(([key, paletteData]) => {
              const isActive = paletteId === key;
              return (
                <button
                  key={key}
                  onClick={() => setPalette(key)}
                  className={cn(
                    "premium-card p-4 flex items-center gap-4 cursor-pointer transition-all text-left",
                    isActive ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                  )}
                >
                  <div className="flex gap-0.5 flex-shrink-0">
                    {paletteData.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{paletteData.name}</p>
                  </div>

                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Opción custom */}
            <button
              onClick={() => setPalette('custom')}
              className={cn(
                "premium-card p-4 flex items-center gap-4 cursor-pointer transition-all text-left",
                paletteId === 'custom' ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
              )}
            >
              <div className="flex gap-0.5 flex-shrink-0">
                {editColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">Personalizada</p>
              </div>
              {paletteId === 'custom' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Editor de paleta custom */}
        <div className="premium-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Paleta personalizada</h2>
          <p className="text-sm text-muted-foreground">
            Pegá 5 colores hex de cualquier generador de paletas (ej: paletacolorpro.com) o editalos uno por uno.
          </p>

          {/* Import rápido */}
          <div className="space-y-2">
            <Label>Importar colores (pegá 5 hex separados por coma o espacio)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="#ffcac8, #fedbd9, #fffaf4, #f9ffff, #fffcf5"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleBulkImport} variant="primary">
                Aplicar
              </Button>
            </div>
          </div>

          {/* Editores individuales */}
          <div className="grid grid-cols-5 gap-3">
            {editColors.map((color, index) => (
              <div key={index} className="space-y-2">
                <div className="flex flex-col items-center gap-1">
                  <label
                    className="relative w-full aspect-square rounded-lg border-2 border-border cursor-pointer overflow-hidden hover:border-primary transition-colors"
                    style={{ backgroundColor: color }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  <Input
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="text-xs text-center h-8 px-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={applyCustomColors} variant="primary" className="w-full">
            Aplicar paleta personalizada
          </Button>
        </div>

        {/* Info del negocio */}
        <div className="premium-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Información del negocio</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium text-foreground">{config.appName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo de negocio</span>
              <span className="font-medium text-foreground">{config.businessLabel}</span>
            </div>
            {config.businessSubtitle && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtítulo</span>
                <span className="font-medium text-foreground">{config.businessSubtitle}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium text-foreground">{config.tenantSlug}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Para cambiar estos datos, modifica las variables de entorno (.env) del proyecto.
          </p>
        </div>
      </motion.div>
    </>
  );
};

export default Configuracion;
