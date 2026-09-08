import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { CustomTheme, ThemeMode } from '../types';
import { buildCustomThemeVars, setCustomThemeRegistry } from '../utils/theme';
import {
  isCustomThemeId,
  loadCustomThemes,
  saveCustomThemes,
} from '../utils/customThemes';
import { ThemeStudioModal } from '../components/ThemeStudioModal';

interface CustomThemeContextValue {
  customThemes: CustomTheme[];
  activeThemeMode: ThemeMode;
  selectTheme: (mode: ThemeMode) => void;
  /** Opens the theme studio, optionally editing an existing theme. */
  openThemeStudio: (themeId?: string) => void;
  saveTheme: (theme: CustomTheme) => void;
  deleteTheme: (themeId: string) => void;
  importThemes: (themes: CustomTheme[]) => CustomTheme[];
}

const CustomThemeContext = createContext<CustomThemeContextValue | null>(null);

export function useCustomThemes(): CustomThemeContextValue {
  const ctx = useContext(CustomThemeContext);
  if (!ctx) {
    throw new Error('useCustomThemes must be used inside a CustomThemeProvider');
  }
  return ctx;
}

interface CustomThemeProviderProps {
  activeThemeMode: ThemeMode;
  onSelectTheme: (mode: ThemeMode) => void;
  children: React.ReactNode;
}

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({
  activeThemeMode,
  onSelectTheme,
  children,
}) => {
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => loadCustomThemes());
  const [studioThemeId, setStudioThemeId] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  // Sync the lookup registry during render so `getThemeConfig(id)` resolves
  // custom ids in the very same commit that adds them.
  useMemo(() => setCustomThemeRegistry(customThemes), [customThemes]);

  useEffect(() => {
    saveCustomThemes(customThemes);
  }, [customThemes]);

  const activeCustomTheme = useMemo(
    () => customThemes.find(t => t.id === activeThemeMode) || null,
    [customThemes, activeThemeMode],
  );

  // Push the active custom theme's colors onto :root. Built-in themes use
  // plain Tailwind classes and need no variables, so we clear them.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!activeCustomTheme) {
      root.removeAttribute('data-custom-theme');
      return;
    }

    const vars = buildCustomThemeVars(activeCustomTheme);
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
    root.setAttribute('data-custom-theme', activeCustomTheme.id);

    return () => {
      Object.keys(vars).forEach(name => root.style.removeProperty(name));
      root.removeAttribute('data-custom-theme');
    };
  }, [activeCustomTheme]);

  // A theme id can survive in storage after its theme is gone (e.g. cleared
  // in another tab). Fall back rather than rendering the default silently.
  useEffect(() => {
    if (isCustomThemeId(activeThemeMode) && !activeCustomTheme) {
      onSelectTheme('light');
    }
  }, [activeThemeMode, activeCustomTheme, onSelectTheme]);

  const saveTheme = useCallback((theme: CustomTheme) => {
    setCustomThemes(prev => {
      const index = prev.findIndex(t => t.id === theme.id);
      if (index === -1) return [...prev, theme];
      const next = [...prev];
      next[index] = theme;
      return next;
    });
  }, []);

  const deleteTheme = useCallback(
    (themeId: string) => {
      setCustomThemes(prev => prev.filter(t => t.id !== themeId));
      if (activeThemeMode === themeId) onSelectTheme('light');
    },
    [activeThemeMode, onSelectTheme],
  );

  /** Adds imported themes, re-issuing ids that would collide with existing ones. */
  const importThemes = useCallback((incoming: CustomTheme[]) => {
    let added: CustomTheme[] = [];
    setCustomThemes(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      added = incoming.map(theme =>
        existingIds.has(theme.id)
          ? { ...theme, id: `${theme.id}-${Math.random().toString(36).slice(2, 7)}` }
          : theme,
      );
      return [...prev, ...added];
    });
    return added;
  }, []);

  const openThemeStudio = useCallback((themeId?: string) => {
    setStudioThemeId(themeId ?? null);
    setIsStudioOpen(true);
  }, []);

  const value = useMemo<CustomThemeContextValue>(
    () => ({
      customThemes,
      activeThemeMode,
      selectTheme: onSelectTheme,
      openThemeStudio,
      saveTheme,
      deleteTheme,
      importThemes,
    }),
    [
      customThemes,
      activeThemeMode,
      onSelectTheme,
      openThemeStudio,
      saveTheme,
      deleteTheme,
      importThemes,
    ],
  );

  return (
    <CustomThemeContext.Provider value={value}>
      {children}
      <ThemeStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        editingThemeId={studioThemeId}
        onChangeEditingThemeId={setStudioThemeId}
      />
    </CustomThemeContext.Provider>
  );
};
