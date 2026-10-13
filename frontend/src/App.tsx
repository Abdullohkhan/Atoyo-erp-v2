import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { useMemo } from 'react'
import { store } from './app/store'
import { router } from './app/router'
import { createAppTheme } from './lib/theme'
import { useAppSelector } from './app/hooks'

function ThemedApp() {
  const mode = useAppSelector((s) => s.theme.mode)
  const theme = useMemo(() => createAppTheme(mode), [mode])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  )
}
