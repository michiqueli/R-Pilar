
export const tokens = {
  radius: {
    card: '16px',
    input: '14px',
    button: '9999px', // Pill shape
    badge: '9999px',
    modal: '20px',
  },
  shadows: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
    cardHover: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    button: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  typography: {
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '2rem',
      letterSpacing: '-0.025em',
    },
    subtitle: {
      fontSize: '1.125rem',
      fontWeight: '500',
      lineHeight: '1.75rem',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--theme-muted-foreground)',
    },
    body: {
      fontSize: '0.875rem',
      lineHeight: '1.5rem',
    }
  },
  spacing: {
    toolbar: '1.5rem', // Generous spacing for toolbars
    tablePadding: '1rem',
    cardPadding: '1.5rem',
    inputPadding: '0.75rem 1rem',
  }
};
