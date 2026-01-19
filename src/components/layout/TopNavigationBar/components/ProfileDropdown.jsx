import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const ProfileDropdown = () => {
  const fundName = 'Celestia Capital Fund' // Your Fund Name
  const fundInitial = fundName.charAt(0).toUpperCase() // Extract First Letter
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const logoutJson = await res.json().catch(() => ({}))
      console.log('🔒 Logout response:', logoutJson)

      // Clear cookies client-side
      Cookies.remove('dashboardToken', { path: '/' })
      Cookies.remove('userToken', { path: '/' })
      
      // Clear any client-side leftovers (only if you ever set them)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      sessionStorage.clear()

      // Redirect to sign-in
      router.replace('/auth/sign-in')
    } catch (e) {
      console.error('Logout failed:', e)
      // Still clear cookies and redirect even if API call fails
      Cookies.remove('dashboardToken', { path: '/' })
      Cookies.remove('userToken', { path: '/' })
      router.replace('/auth/sign-in')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <Dropdown className="topbar-item" drop="down">
      <DropdownToggle
        as={'a'}
        type="button"
        className="topbar-button content-none"
        id="page-header-user-dropdown "
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false">
        <span className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
            style={{
              width: '32px',
              height: '32px',
              fontSize: '16px',
            }}>
            {fundInitial}
          </div>
        </span>
      </DropdownToggle>
      {/* Dropdown Menu */}
      {/* Dropdown Menu */}
      <DropdownMenu className="dropdown-menu-end">
        {/* Display Fund Name */}
        <DropdownHeader as={'h6'} className="dropdown-header">
          Celestia Capital Fund
        </DropdownHeader>

        {/* "Switch Fund" Option */}
        <DropdownItem as={Link} href="/fundlist">
          <IconifyIcon icon="ri:swap-line" className="align-middle me-2 fs-18" />
          <span className="align-middle">Switch Fund</span>
        </DropdownItem>

        {/* Divider */}
        <div className="dropdown-divider my-1" />

        {/* Logout Option */}
        <DropdownItem as="button" className="text-danger w-100 text-start" onClick={handleLogout} disabled={loggingOut}>
          <IconifyIcon icon="ri:logout-box-line" className="align-middle me-2 fs-18" />
          <span className="align-middle">{loggingOut ? 'Logging out…' : 'Logout'}</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
export default ProfileDropdown
