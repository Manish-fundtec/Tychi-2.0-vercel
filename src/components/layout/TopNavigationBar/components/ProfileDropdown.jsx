import avatar1 from '@/assets/images/users/avatar-1.jpg'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Image from 'next/image'
import Link from 'next/link'
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
const ProfileDropdown = () => {
  const fundName = 'Celestia Capital Fund' // Your Fund Name
  const fundInitial = fundName.charAt(0).toUpperCase() // Extract First Letter


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
        <DropdownItem as={Link} className="text-danger" href="/auth/sign-in">
          <IconifyIcon icon="ri:logout-box-line" className="align-middle me-2 fs-18" />
          <span className="align-middle">Logout</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
export default ProfileDropdown