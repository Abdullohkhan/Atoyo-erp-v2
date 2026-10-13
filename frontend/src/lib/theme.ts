import { createTheme, type PaletteMode } from '@mui/material'

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#2563EB', light: '#3B82F6', dark: '#1D4ED8', contrastText: '#fff' },
          secondary: { main: '#0EA5E9', light: '#38BDF8', dark: '#0284C7' },
          background: { default: '#F1F5F9', paper: '#FFFFFF' },
          text: { primary: '#0F172A', secondary: '#475569' },
          divider: '#E2E8F0',
          success: { main: '#22C55E', light: '#86EFAC', dark: '#16A34A' },
          warning: { main: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
          error: { main: '#EF4444', light: '#FCA5A5', dark: '#DC2626' },
          info: { main: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED' },
        }
      : {
          primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', contrastText: '#fff' },
          secondary: { main: '#38BDF8', light: '#7DD3FC', dark: '#0EA5E9' },
          background: { default: '#0B1120', paper: '#111827' },
          text: { primary: '#F1F5F9', secondary: '#94A3B8' },
          divider: '#1E293B',
          success: { main: '#4ADE80', light: '#86EFAC', dark: '#22C55E' },
          warning: { main: '#FBBF24', light: '#FCD34D', dark: '#F59E0B' },
          error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
          info: { main: '#A78BFA', light: '#C4B5FD', dark: '#8B5CF6' },
        }),
  },
})

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    ...getDesignTokens(mode),
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Nunito", system-ui, sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: mode === 'dark'
              ? '0 4px 24px rgba(0,0,0,0.4)'
              : '0 2px 16px rgba(37,99,235,0.06)',
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiTableCell-head': {
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: theme.palette.text.secondary,
              backgroundColor: mode === 'dark' ? '#1E293B' : '#F8FAFC',
            },
          }),
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: () => ({
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(59,130,246,0.06)' : 'rgba(37,99,235,0.04)',
            },
            transition: 'background-color 0.15s',
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 600 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#0D1526' : '#FFFFFF',
            borderRight: mode === 'dark' ? '1px solid #1E293B' : '1px solid #E2E8F0',
          },
        },
      },
    },
  })
