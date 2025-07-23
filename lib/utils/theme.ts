// Theme Configuration
// This file contains all colors and styling constants used throughout the app
// Modify these values to change the entire app's theme

export const theme = {
  // Core Colors
  colors: {
    // Background colors
    background: {
      primary: '#000000',        // Main background (pitch black)
      secondary: '#0a0a0a',      // Secondary background (very dark)
      tertiary: '#111111',       // Tertiary background (slightly lighter)
      modal: '#000000/90',       // Modal backdrop
      card: '#0d0d0d',          // Card backgrounds
      input: '#0f0f0f',         // Input field backgrounds
    },
    
    // Neon color palette
    neon: {
      // Primary neon - Lime Green
      lime: {
        main: '#d0ff16',           // Main lime neon
        bright: '#e5ff4a',         // Brighter lime
        dim: '#a8cc12',            // Dimmer lime
        glow: '#d0ff16/30',        // Glow effect
        subtle: '#d0ff16/10',      // Very subtle background
        border: '#d0ff16/40',      // Border color
      },
      // Secondary neon - Electric Cyan
      cyan: {
        main: '#00ffff',           // Main cyan neon
        bright: '#4dffff',         // Brighter cyan
        dim: '#00cccc',            // Dimmer cyan
        glow: '#00ffff/30',        // Glow effect
        subtle: '#00ffff/10',      // Very subtle background
        border: '#00ffff/40',      // Border color
      },
      // Accent neon - Hot Pink
      pink: {
        main: '#ff1493',           // Main pink neon
        bright: '#ff47a3',         // Brighter pink
        dim: '#cc1075',            // Dimmer pink
        glow: '#ff1493/30',        // Glow effect
        subtle: '#ff1493/10',      // Very subtle background
        border: '#ff1493/40',      // Border color
      },
      // Electric Purple
      purple: {
        main: '#9d00ff',           // Main purple neon
        bright: '#b347ff',         // Brighter purple
        dim: '#7a00cc',            // Dimmer purple
        glow: '#9d00ff/30',        // Glow effect
        subtle: '#9d00ff/10',      // Very subtle background
        border: '#9d00ff/40',      // Border color
      },
    },
    
    // Primary/Accent color (using lime as main)
    primary: {
      main: '#d0ff16',           // Main accent color (lime green)
      hover: '#e5ff4a',          // Hover state (brighter lime)
      active: '#a8cc12',         // Active state (dimmer lime)
      light: '#d0ff16/20',       // Light variant
      border: '#d0ff16/40',      // Border variant
      borderHover: '#d0ff16/60', // Border hover variant
      shadow: '#d0ff16/25',      // Shadow variant
      glow: '#d0ff16/30',        // Glow effect
    },
    
    // Secondary accent (using cyan)
    secondary: {
      main: '#00ffff',           // Secondary accent (cyan)
      hover: '#4dffff',          // Hover state
      active: '#00cccc',         // Active state
      light: '#00ffff/20',       // Light variant
      border: '#00ffff/40',      // Border variant
      borderHover: '#00ffff/60', // Border hover variant
      shadow: '#00ffff/25',      // Shadow variant
      glow: '#00ffff/30',        // Glow effect
    },
    
    // Text colors
    text: {
      primary: '#ffffff',        // Primary text (white)
      secondary: '#e5e5e5',      // Secondary text (light gray)
      tertiary: '#b3b3b3',       // Tertiary text (medium gray)
      muted: '#808080',          // Muted text (darker gray)
      onPrimary: '#000000',      // Text on primary color backgrounds
      onSecondary: '#000000',    // Text on secondary color backgrounds
      neonLime: '#d0ff16',       // Neon lime text
      neonCyan: '#00ffff',       // Neon cyan text
      neonPink: '#ff1493',       // Neon pink text
    },
    
    // Border colors
    border: {
      primary: '#333333',        // Primary border (subtle grey)
      secondary: '#262626',      // Secondary border (darker grey)
      tertiary: '#404040',       // Tertiary border (lighter grey for contrast)
      neon: '#d0ff16/40',        // Neon border
      neonHover: '#d0ff16/60',   // Neon border hover
      neonCyan: '#00ffff/40',    // Cyan border
      neonPink: '#ff1493/40',    // Pink border
    },
    
    // State colors
    success: {
      main: '#d0ff16',           // Success using lime neon
      light: '#d0ff16/20',       // Light success
      border: '#d0ff16/40',      // Success border
      glow: '#d0ff16/30',        // Success glow
    },
    
    error: {
      main: '#ff1493',           // Error using pink neon
      light: '#ff1493/20',       // Light error
      border: '#ff1493/40',      // Error border
      glow: '#ff1493/30',        // Error glow
    },
    
    warning: {
      main: '#ff9500',           // Warning orange neon
      light: '#ff9500/20',       // Light warning
      border: '#ff9500/40',      // Warning border
      glow: '#ff9500/30',        // Warning glow
    },
    
    info: {
      main: '#00ffff',           // Info using cyan neon
      light: '#00ffff/20',       // Light info
      border: '#00ffff/40',      // Info border
      glow: '#00ffff/30',        // Info glow
    },
    
    // Legacy purple (keeping for backward compatibility)
    purple: {
      main: '#9d00ff',           // Purple neon
      light: '#9d00ff/20',       // Light purple
      border: '#9d00ff/40',      // Purple border
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },
  
  // Border radius
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
  },
  
  // Shadows with neon glow effects
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    neonLime: '0 0 20px #d0ff16/50, 0 0 40px #d0ff16/30',
    neonCyan: '0 0 20px #00ffff/50, 0 0 40px #00ffff/30',
    neonPink: '0 0 20px #ff1493/50, 0 0 40px #ff1493/30',
    neonPurple: '0 0 20px #9d00ff/50, 0 0 40px #9d00ff/30',
  },
  
  // Transitions
  transitions: {
    fast: '0.15s ease-in-out',
    normal: '0.2s ease-in-out',
    slow: '0.3s ease-in-out',
    glow: '0.3s ease-in-out',
  },
  
  // Component-specific styles
  components: {
    button: {
      primary: {
        bg: '#d0ff16',
        text: '#000000',
        hover: '#e5ff4a',
        shadow: '0 0 20px #d0ff16/40',
        hoverShadow: '0 0 30px #d0ff16/60',
      },
      secondary: {
        bg: 'transparent',
        text: '#d0ff16',
        border: '#d0ff16/40',
        hover: '#d0ff16/10',
        hoverBorder: '#d0ff16/60',
        hoverText: '#e5ff4a',
      },
      cyan: {
        bg: 'transparent',
        text: '#00ffff',
        border: '#00ffff/40',
        hover: '#00ffff/10',
        hoverBorder: '#00ffff/60',
        hoverText: '#4dffff',
      },
      danger: {
        bg: 'transparent',
        text: '#ff1493',
        border: '#ff1493/40',
        hover: '#ff1493/10',
        hoverBorder: '#ff1493/60',
        hoverText: '#ff47a3',
      },
    },
    
    input: {
      bg: '#0f0f0f',
      border: '#333333',
      text: '#ffffff',
      placeholder: '#808080',
      focus: {
        ring: '#d0ff16/50',
        border: '#d0ff16/60',
        glow: '0 0 15px #d0ff16/30',
      },
    },
    
    card: {
      bg: '#0d0d0d',
      border: '#333333',
      hover: {
        bg: '#111111',
        border: '#d0ff16/50',
        shadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 15px #d0ff16/20',
      },
      selected: {
        bg: '#d0ff16/10',
        border: '#d0ff16/60',
        text: '#ffffff',
        shadow: '0 0 25px #d0ff16/40',
        glow: '0 0 15px #d0ff16/30',
      },
    },
    
    modal: {
      backdrop: '#000000/90',
      bg: '#0a0a0a',
      border: '#333333',
    },
  },
};

// Helper functions for consistent styling
export const getButtonStyles = (variant: 'primary' | 'secondary' | 'cyan' | 'danger' = 'primary') => {
  const styles = theme.components.button[variant];
  const borderClass = 'border' in styles ? `border border-[${styles.border}]` : '';
  const hoverBorderClass = 'hoverBorder' in styles ? `hover:border-[${styles.hoverBorder}]` : '';
  const shadowClass = 'shadow' in styles ? `shadow-[${styles.shadow}]` : '';
  const hoverShadowClass = 'hoverShadow' in styles ? `hover:shadow-[${styles.hoverShadow}]` : '';
  
  return `bg-[${styles.bg}] text-[${styles.text}] ${borderClass} hover:bg-[${styles.hover}] ${hoverBorderClass} ${shadowClass} ${hoverShadowClass} transition-all duration-200`;
};

export const getInputStyles = () => {
  const styles = theme.components.input;
  return `bg-[${styles.bg}] border border-[${styles.border}] text-[${styles.text}] placeholder:text-[${styles.placeholder}] focus:outline-none focus:ring-2 focus:ring-[${styles.focus.ring}] focus:border-[${styles.focus.border}] focus:shadow-[${styles.focus.glow}] transition-all`;
};

export const getCardStyles = (selected: boolean = false) => {
  const styles = theme.components.card;
  if (selected) {
    return `bg-[${styles.selected.bg}] border border-[${styles.selected.border}] text-[${styles.selected.text}] shadow-[${styles.selected.shadow}] transform scale-[1.02]`;
  }
  return `bg-[${styles.bg}] border border-[${styles.border}] hover:bg-[${styles.hover.bg}] hover:border-[${styles.hover.border}] hover:shadow-[${styles.hover.shadow}] hover:transform hover:scale-[1.01] transition-all duration-200`;
};

export const getModalStyles = () => {
  const styles = theme.components.modal;
  return {
    backdrop: `bg-[${styles.backdrop}]`,
    container: `bg-[${styles.bg}] border border-[${styles.border}]`,
  };
};

export default theme; 