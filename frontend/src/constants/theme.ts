export const COLORS = {
  background: { default: '#050505', paper: '#0A0A0A', subtle: '#121212', elevated: '#1A1A2E' },
  primary: { main: '#00F3FF', light: '#5CFFFF', dark: '#009099', glow: 'rgba(0, 243, 255, 0.5)' },
  secondary: { main: '#7B2CBF', light: '#9D4EDD', dark: '#5A189A', glow: 'rgba(123, 44, 191, 0.5)' },
  accent: { success: '#00FF9D', warning: '#FFD60A', error: '#FF003C', info: '#3A86FF' },
  text: { primary: '#FFFFFF', secondary: '#A3A3A3', disabled: '#525252' },
  border: { default: '#333333', active: '#00F3FF', subtle: '#1F1F1F' },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const FONT_SIZES = { xs: 10, sm: 12, md: 14, body: 16, lg: 18, xl: 20, xxl: 24, title: 28, hero: 32 };

export const SHADOWS = {
  neonCyan: { shadowColor: '#00F3FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 5 },
  neonPurple: { shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 5 },
  subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
};

export const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
