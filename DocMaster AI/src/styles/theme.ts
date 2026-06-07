import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4361EE',       // Premium Indigo
    secondary: '#4895EF',     // Vibrant Blue
    tertiary: '#FF5722',      // Deep Coral
    background: '#F8F9FA',    // Clean slate/light grey
    surface: '#FFFFFF',       // Card surfaces
    error: '#FF003C',         // Vivid crimson red
    text: '#2B2D42',          // Charcoal text
    placeholder: '#8D99AE',   // Slate grey placeholder
    disabled: '#E2E8F0',
    outline: '#CBD5E1',
  },
  roundness: 12,
};

export type AppTheme = typeof theme;
