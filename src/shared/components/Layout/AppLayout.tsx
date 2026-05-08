import { Box, useMediaQuery, useTheme, Drawer } from '@mui/material'
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ProductSearchModal from '@/shared/components/ProductSearchModal/ProductSearchModal'
import { useAppDispatch } from '@/app/hooks'
import { fetchProducts } from '@/features/catalogs/products/store/productsSlice'

export default function AppLayout() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => { dispatch(fetchProducts()) }, [dispatch])

  // Global Ctrl+Space listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen((p) => !p)
    else setCollapsed((p) => !p)
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {!isMobile && <Sidebar collapsed={collapsed} />}
      {isMobile && (
        <Drawer
          open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: 260 } }}
        >
          <Sidebar collapsed={false} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar onToggleSidebar={toggleSidebar} onOpenSearch={() => setSearchOpen(true)} />
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 4 },
        }}>
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </Box>
      </Box>

      {/* Global product search */}
      <ProductSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={() => setSearchOpen(false)}
      />
    </Box>
  )
}
