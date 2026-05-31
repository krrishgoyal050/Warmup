import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface AccessibilityContextType {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  toggleHighContrast: () => void;
  setFontSizeScale: (scale: 'normal' | 'large' | 'extra-large') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('accessibility_high_contrast') === 'true';
  });

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>(() => {
    return (localStorage.getItem('accessibility_font_size') as any) || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('accessibility_high_contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('accessibility_font_size', fontSize);
  }, [fontSize]);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const setFontSizeScale = (scale: 'normal' | 'large' | 'extra-large') => setFontSize(scale);

  // Dynamic Typography Font Sizes
  const getFontSizeRem = (baseSize: number) => {
    let multiplier = 1;
    if (fontSize === 'large') multiplier = 1.2;
    else if (fontSize === 'extra-large') multiplier = 1.4;
    return `${baseSize * multiplier}rem`;
  };

  // Build the Material UI custom premium theme dynamically
  const theme: Theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: highContrast ? '#fbbf24' : '#6366f1', // Bright amber in high contrast, violet in standard
      },
      secondary: {
        main: highContrast ? '#22d3ee' : '#14b8a6', // Cyan in high contrast, teal in standard
      },
      background: {
        default: highContrast ? '#000000' : '#030712',
        paper: highContrast ? '#0a0a0a' : '#111827',
      },
      text: {
        primary: '#ffffff',
        secondary: highContrast ? '#cccccc' : '#9ca3af',
      },
      divider: highContrast ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
    },
    typography: {
      fontFamily: "'Inter', 'Outfit', sans-serif",
      h1: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: getFontSizeRem(2.5),
      },
      h2: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        fontSize: getFontSizeRem(2),
      },
      h3: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        fontSize: getFontSizeRem(1.5),
      },
      h4: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        fontSize: getFontSizeRem(1.25),
      },
      body1: {
        fontSize: getFontSizeRem(1),
        lineHeight: 1.6,
      },
      body2: {
        fontSize: getFontSizeRem(0.875),
        lineHeight: 1.5,
      },
      button: {
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            padding: '10px 22px',
            boxShadow: highContrast ? 'none' : '0 4px 14px 0 rgba(99, 102, 241, 0.2)',
            border: highContrast ? '2px solid #fbbf24' : 'none',
            '&:hover': {
              boxShadow: highContrast ? 'none' : '0 6px 20px 0 rgba(99, 102, 241, 0.3)',
              backgroundColor: highContrast ? '#fbbf24' : undefined,
              color: highContrast ? '#000000' : undefined,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            backgroundImage: 'none',
            backgroundColor: highContrast ? '#000000' : 'rgba(17, 24, 39, 0.6)',
            backdropFilter: highContrast ? 'none' : 'blur(16px)',
            border: highContrast ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: highContrast ? 'none' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          },
        },
      },
    },
  });

  return (
    <AccessibilityContext.Provider value={{ highContrast, fontSize, toggleHighContrast, setFontSizeScale }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be wrapped in an AccessibilityProvider');
  }
  return context;
};
