/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // NGX Design System - Font Families
      fontFamily: {
        'ngx-primary': ['Josefin Sans', 'Inter', 'sans-serif'],
        'ngx-secondary': ['Inter', 'Source Sans Pro', 'sans-serif'],
        'ngx-mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // NGX Design System - Colors
      colors: {
        // NGX Core Colors
        'ngx-black-onyx': '#000000',
        'ngx-electric-violet': '#8B5CF6',
        'ngx-deep-purple': '#5B21B6',
        'ngx-white': '#FFFFFF',
        'ngx-dark-gray': '#333333',
        
        // NGX Program Colors
        'ngx-prime': {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#92400E',
        },
        'ngx-longevity': {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#047857',
        },
        'ngx-custom': {
          DEFAULT: '#6366F1',
          light: '#E0E7FF',
          dark: '#4338CA',
        },
        
        // Shadcn/ui compatible colors mapped to NGX palette
        background: 'var(--ngx-background)',
        foreground: 'var(--ngx-text-primary)',
        card: {
          DEFAULT: 'var(--ngx-glass-background)',
          foreground: 'var(--ngx-text-primary)',
        },
        popover: {
          DEFAULT: 'var(--ngx-glass-background)',
          foreground: 'var(--ngx-text-primary)',
        },
        primary: {
          DEFAULT: 'var(--ngx-electric-violet)',
          foreground: 'var(--ngx-white)',
        },
        secondary: {
          DEFAULT: 'var(--ngx-deep-purple)',
          foreground: 'var(--ngx-white)',
        },
        muted: {
          DEFAULT: 'var(--ngx-surface)',
          foreground: 'var(--ngx-text-secondary)',
        },
        accent: {
          DEFAULT: 'var(--ngx-electric-violet)',
          foreground: 'var(--ngx-white)',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: 'var(--ngx-white)',
        },
        border: 'var(--ngx-border)',
        input: 'var(--ngx-surface)',
        ring: 'var(--ngx-electric-violet)',
        chart: {
          1: 'var(--ngx-electric-violet)',
          2: 'var(--ngx-deep-purple)',
          3: 'var(--ngx-prime)',
          4: 'var(--ngx-longevity)',
          5: 'var(--ngx-custom)',
        },
      },
      
      // NGX Design System - Border Radius
      borderRadius: {
        'ngx-sm': 'var(--ngx-radius-sm)',
        'ngx-md': 'var(--ngx-radius-md)',
        'ngx-lg': 'var(--ngx-radius-lg)',
        'ngx-xl': 'var(--ngx-radius-xl)',
        'ngx-2xl': 'var(--ngx-radius-2xl)',
        'ngx-full': 'var(--ngx-radius-full)',
        lg: "var(--ngx-radius-lg)",
        md: "var(--ngx-radius-md)",
        sm: "var(--ngx-radius-sm)",
      },
      
      // NGX Design System - Spacing
      spacing: {
        'ngx-1': 'var(--ngx-space-1)',
        'ngx-2': 'var(--ngx-space-2)',
        'ngx-3': 'var(--ngx-space-3)',
        'ngx-4': 'var(--ngx-space-4)',
        'ngx-5': 'var(--ngx-space-5)',
        'ngx-6': 'var(--ngx-space-6)',
        'ngx-8': 'var(--ngx-space-8)',
        'ngx-10': 'var(--ngx-space-10)',
        'ngx-12': 'var(--ngx-space-12)',
        'ngx-16': 'var(--ngx-space-16)',
      },
      
      // NGX Design System - Box Shadows
      boxShadow: {
        'ngx-sm': 'var(--ngx-shadow-sm)',
        'ngx-md': 'var(--ngx-shadow-md)',
        'ngx-lg': 'var(--ngx-shadow-lg)',
        'ngx-xl': 'var(--ngx-shadow-xl)',
        'ngx-glow-sm': 'var(--ngx-glow-sm)',
        'ngx-glow-md': 'var(--ngx-glow-md)',
        'ngx-glow-lg': 'var(--ngx-glow-lg)',
      },
      
      // NGX Design System - Backdrop Blur
      backdropBlur: {
        'ngx': '12px',
        'ngx-strong': '20px',
      },
      
      // NGX Design System - Keyframes & Animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "ngx-pulse": {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        "ngx-bounce": {
          '0%, 100%': { 
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': { 
            transform: 'none',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        "ngx-float": {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        "ngx-glow": {
          '0%, 100%': { boxShadow: 'var(--ngx-glow-sm)' },
          '50%': { boxShadow: 'var(--ngx-glow-md)' },
        },
        "ngx-scale": {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ngx-pulse": "ngx-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ngx-bounce": "ngx-bounce 1s infinite",
        "ngx-float": "ngx-float 3s ease-in-out infinite",
        "ngx-glow": "ngx-glow 2s ease-in-out infinite",
        "ngx-scale": "ngx-scale 2s ease-in-out infinite",
      },
      
      // NGX Design System - Typography
      fontSize: {
        'ngx-xs': 'var(--ngx-text-xs)',
        'ngx-sm': 'var(--ngx-text-sm)',
        'ngx-base': 'var(--ngx-text-base)',
        'ngx-lg': 'var(--ngx-text-lg)',
        'ngx-xl': 'var(--ngx-text-xl)',
        'ngx-2xl': 'var(--ngx-text-2xl)',
        'ngx-3xl': 'var(--ngx-text-3xl)',
        'ngx-4xl': 'var(--ngx-text-4xl)',
        'ngx-5xl': 'var(--ngx-text-5xl)',
      },
      
      // NGX Design System - Z-Index
      zIndex: {
        'ngx-dropdown': 'var(--ngx-z-dropdown)',
        'ngx-modal': 'var(--ngx-z-modal)',
        'ngx-popover': 'var(--ngx-z-popover)',
        'ngx-tooltip': 'var(--ngx-z-tooltip)',
        'ngx-overlay': 'var(--ngx-z-overlay)',
      },
      
      // NGX Design System - Transition Duration
      transitionDuration: {
        'ngx-fast': 'var(--ngx-duration-fast)',
        'ngx-normal': 'var(--ngx-duration-normal)',
        'ngx-slow': 'var(--ngx-duration-slow)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    
    // NGX Custom Plugin for additional utilities
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        // NGX Glass Morphism utilities
        '.ngx-glass': {
          background: 'var(--ngx-glass-background)',
          backdropFilter: 'var(--ngx-glass-backdrop)',
          border: '1px solid var(--ngx-glass-border)',
        },
        '.ngx-glass-strong': {
          background: 'rgba(139, 92, 246, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        
        // NGX Gradient utilities
        '.ngx-gradient-primary': {
          background: 'linear-gradient(135deg, var(--ngx-electric-violet) 0%, var(--ngx-deep-purple) 100%)',
        },
        '.ngx-gradient-subtle': {
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(91, 33, 182, 0.1) 100%)',
        },
        
        // NGX Text utilities
        '.ngx-text-primary': {
          fontFamily: 'var(--ngx-font-primary)',
        },
        '.ngx-text-secondary': {
          fontFamily: 'var(--ngx-font-secondary)',
        },
      }
      
      const newComponents = {
        // NGX Button components
        '.ngx-btn-primary': {
          background: 'var(--ngx-gradient-primary)',
          color: 'var(--ngx-white)',
          border: 'none',
          padding: 'var(--ngx-space-3) var(--ngx-space-6)',
          borderRadius: 'var(--ngx-radius-lg)',
          fontFamily: 'var(--ngx-font-primary)',
          fontWeight: 'var(--ngx-font-semibold)',
          transition: 'all var(--ngx-duration-normal) var(--ngx-ease-out)',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 'var(--ngx-glow-md)',
            transform: 'translateY(-2px)',
          },
        },
        
        // NGX Card components
        '.ngx-card': {
          background: 'var(--ngx-glass-background)',
          backdropFilter: 'var(--ngx-glass-backdrop)',
          border: '1px solid var(--ngx-glass-border)',
          borderRadius: 'var(--ngx-radius-xl)',
          padding: 'var(--ngx-space-6)',
          boxShadow: 'var(--ngx-shadow-lg)',
          transition: 'all var(--ngx-duration-normal) var(--ngx-ease-out)',
          '&:hover': {
            borderColor: 'var(--ngx-border-hover)',
            boxShadow: 'var(--ngx-shadow-xl)',
            transform: 'translateY(-2px)',
          },
        },
      }
      
      addUtilities(newUtilities)
      addComponents(newComponents)
    }
  ],
};