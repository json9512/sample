import { useState, useEffect } from 'react'

export function useMobileSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Close on route change or screen size change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])
  
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const openMobileMenu = () => setIsMobileMenuOpen(true)
  
  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    openMobileMenu
  }
}