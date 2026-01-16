
export const themes = {
  yellow: {
    name: 'Amarillo/Gris',
    colors: {
      light: {
        primary: '#EAB308', // yellow-500
        primaryForeground: '#FFFFFF',
        secondary: '#F3F4F6', // gray-100
        secondaryForeground: '#1F2937', // gray-800
        accent: '#FEF08A', // yellow-200
        accentForeground: '#854D0E', // yellow-900
        background: '#FFFFFF',
        foreground: '#1F2937', // gray-800
        muted: '#F3F4F6', // gray-100
        mutedForeground: '#6B7280', // gray-500
        border: '#E5E7EB', // gray-200
        input: '#F9FAFB', // gray-50
        ring: '#EAB308', // yellow-500
      },
      dark: {
        primary: '#FACC15', // yellow-400
        primaryForeground: '#1F2937', // gray-800
        secondary: '#374151', // gray-700
        secondaryForeground: '#F9FAFB', // gray-50
        accent: '#854D0E', // yellow-900
        accentForeground: '#FEF08A', // yellow-200
        background: '#111827', // gray-900
        foreground: '#F9FAFB', // gray-50
        muted: '#1F2937', // gray-800
        mutedForeground: '#9CA3AF', // gray-400
        border: '#374151', // gray-700
        input: '#1F2937', // gray-800
        ring: '#FACC15', // yellow-400
      },
    },
  },
  blue: {
    name: 'Azul/Gris',
    colors: {
      light: {
        primary: '#2563EB', // blue-600
        primaryForeground: '#FFFFFF',
        secondary: '#F1F5F9', // slate-100
        secondaryForeground: '#1E293B', // slate-800
        accent: '#DBEAFE', // blue-100
        accentForeground: '#1E40AF', // blue-800
        background: '#FFFFFF',
        foreground: '#0F172A', // slate-900
        muted: '#F8FAFC', // slate-50
        mutedForeground: '#64748B', // slate-500
        border: '#E2E8F0', // slate-200
        input: '#F8FAFC',
        ring: '#2563EB',
      },
      dark: {
        primary: '#3B82F6', // blue-500
        primaryForeground: '#FFFFFF',
        secondary: '#1E293B', // slate-800
        secondaryForeground: '#F8FAFC', // slate-50
        accent: '#1E40AF', // blue-800
        accentForeground: '#DBEAFE', // blue-100
        background: '#0F172A', // slate-900
        foreground: '#F8FAFC', // slate-50
        muted: '#1E293B', // slate-800
        mutedForeground: '#94A3B8', // slate-400
        border: '#1E293B', // slate-800
        input: '#1E293B',
        ring: '#3B82F6',
      },
    },
  },
  green: {
    name: 'Verde/Gris',
    colors: {
      light: {
        primary: '#10B981', // emerald-500
        primaryForeground: '#FFFFFF',
        secondary: '#F0FDF4', // emerald-50
        secondaryForeground: '#064E3B', // emerald-900
        accent: '#D1FAE5', // emerald-100
        accentForeground: '#065F46', // emerald-800
        background: '#FFFFFF',
        foreground: '#064E3B', // emerald-900
        muted: '#ECFDF5', // emerald-50
        mutedForeground: '#34D399', // emerald-400
        border: '#D1FAE5', // emerald-100
        input: '#F0FDF4',
        ring: '#10B981',
      },
      dark: {
        primary: '#34D399', // emerald-400
        primaryForeground: '#064E3B', // emerald-900
        secondary: '#064E3B', // emerald-900
        secondaryForeground: '#ECFDF5', // emerald-50
        accent: '#065F46', // emerald-800
        accentForeground: '#D1FAE5', // emerald-100
        background: '#022C22', // emerald-950
        foreground: '#ECFDF5', // emerald-50
        muted: '#064E3B', // emerald-900
        mutedForeground: '#6EE7B7', // emerald-300
        border: '#065F46', // emerald-800
        input: '#064E3B',
        ring: '#34D399',
      },
    },
  },
  monochrome: {
    name: 'Monocromo',
    colors: {
      light: {
        primary: '#171717', // neutral-900
        primaryForeground: '#FFFFFF',
        secondary: '#F5F5F5', // neutral-100
        secondaryForeground: '#171717', // neutral-900
        accent: '#E5E5E5', // neutral-200
        accentForeground: '#171717', // neutral-900
        background: '#FFFFFF',
        foreground: '#0A0A0A', // neutral-950
        muted: '#FAFAFA', // neutral-50
        mutedForeground: '#737373', // neutral-500
        border: '#E5E5E5', // neutral-200
        input: '#FFFFFF',
        ring: '#171717',
      },
      dark: {
        primary: '#FFFFFF',
        primaryForeground: '#171717', // neutral-900
        secondary: '#262626', // neutral-800
        secondaryForeground: '#FFFFFF',
        accent: '#404040', // neutral-700
        accentForeground: '#FFFFFF',
        background: '#0A0A0A', // neutral-950
        foreground: '#FFFFFF',
        muted: '#262626', // neutral-800
        mutedForeground: '#A3A3A3', // neutral-400
        border: '#262626', // neutral-800
        input: '#171717',
        ring: '#FFFFFF',
      },
    },
  },
  black: {
    name: 'Black',
    colors: {
      light: {
        primary: '#000000',
        primaryForeground: '#FFFFFF',
        secondary: '#F4F4F5', // zinc-100
        secondaryForeground: '#18181B', // zinc-900
        accent: '#E4E4E7', // zinc-200
        accentForeground: '#18181B', // zinc-900
        background: '#FFFFFF',
        foreground: '#09090B', // zinc-950
        muted: '#FAFAFA', // zinc-50
        mutedForeground: '#71717A', // zinc-500
        border: '#E4E4E7', // zinc-200
        input: '#FFFFFF',
        ring: '#18181B',
      },
      dark: {
        primary: '#FFFFFF',
        primaryForeground: '#000000',
        secondary: '#27272A', // zinc-800
        secondaryForeground: '#FFFFFF',
        accent: '#3F3F46', // zinc-700
        accentForeground: '#FFFFFF',
        background: '#000000',
        foreground: '#FFFFFF',
        muted: '#18181B', // zinc-900
        mutedForeground: '#A1A1AA', // zinc-400
        border: '#27272A', // zinc-800
        input: '#09090B',
        ring: '#FFFFFF',
      },
    },
  },
};
