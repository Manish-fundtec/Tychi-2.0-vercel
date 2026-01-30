'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Row,
  Form,
  FormGroup,
  FormLabel,
  FormControl,
  FormSelect,
  FormCheck,
  Button,
  Spinner,
  Alert,
} from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import api from '@/lib/api/axios'
import { useNotificationContext } from '@/context/useNotificationContext'
import { getAllFundsAdmin } from '@/lib/api/fund'

const PERMISSION_TYPES = [
  { key: 'can_view', label: 'View' },
  { key: 'can_add', label: 'Add' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
]

const EditRolePage = () => {
  const router = useRouter()
  const params = useParams()
  const roleId = params?.id
  const { showNotification } = useNotificationContext()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [funds, setFunds] = useState([])
  const [modules, setModules] = useState([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [loadingFunds, setLoadingFunds] = useState(false)
  const [loadingModules, setLoadingModules] = useState(true)
  const [error, setError] = useState('')

  // Form state - matching guide structure
  const [formData, setFormData] = useState({
    role_name: '',
    role_description: '',
    org_id: '',
    funds: [], // Array of selected fund IDs
    permissions: {}, // { fundId: { moduleKey: { can_view, can_add, can_edit, can_delete } } }
    fundModulePermissions: { // Fund module permissions (applies globally, not fund-specific)
      can_add: false,
      can_edit: false,
      can_delete: false
    }
  })

  // Fetch role data on mount
  useEffect(() => {
    const fetchRoleData = async () => {
      if (!roleId) {
        setError('Role ID is required')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Fetch all organizations first
        const orgsResponse = await api.get('/api/v1/organization')
        const orgs = orgsResponse.data?.data || orgsResponse.data || []
        setOrganizations(orgs)

        // Find role by fetching from all organizations
        let roleData = null
        for (const org of orgs) {
          try {
            const orgId = org.organization_id || org.id
            const response = await api.get(`/api/v1/roles/org/${orgId}/with-permissions`)
            const roles = response.data?.data || response.data || []
            const foundRole = roles.find(r => (r.role_id || r.id) == roleId)
            if (foundRole) {
              roleData = foundRole
              break
            }
          } catch (err) {
            console.error(`Error fetching roles for org ${org.organization_id || org.id}:`, err)
          }
        }

        if (!roleData) {
          setError('Role not found')
          setLoading(false)
          return
        }

        // Set form data from role
        const orgId = roleData.org_id || roleData.organization_id || organizations[0]?.organization_id || organizations[0]?.id
        const roleFunds = roleData.funds || []
        const rolePermissions = roleData.permissions || []

        // Build permissions object
        const permissionsObj = {}
        const fundIds = []
        
        // Extract fund IDs from roleFunds (ensure they're strings for consistent comparison)
        roleFunds.forEach(fund => {
          const fundId = String(fund.fund_id || fund.id || fund)
          if (fundId && fundId !== 'undefined' && fundId !== 'null') {
            fundIds.push(fundId)
            permissionsObj[fundId] = {}
          }
        })

        // Extract fund module permissions (module_key = 'fund')
        let fundModulePerms = {
          can_add: false,
          can_edit: false,
          can_delete: false
        }

        // Build permissions structure from rolePermissions
        rolePermissions.forEach(perm => {
          const fundId = String(perm.fund_id || perm.fundId)
          const moduleKey = (perm.module_key || perm.moduleKey || '').toLowerCase().trim()
          
          // Check if this is a fund module permission
          if (moduleKey === 'fund' || moduleKey === 'funds') {
            // Extract fund module permissions (use the first occurrence or combine all)
            if (perm.can_add === true || perm.can_add === 1 || perm.can_add === '1' || perm.can_add === 'true') {
              fundModulePerms.can_add = true
            }
            if (perm.can_edit === true || perm.can_edit === 1 || perm.can_edit === '1' || perm.can_edit === 'true') {
              fundModulePerms.can_edit = true
            }
            if (perm.can_delete === true || perm.can_delete === 1 || perm.can_delete === '1' || perm.can_delete === 'true') {
              fundModulePerms.can_delete = true
            }
            // Skip adding fund module to regular permissions - we handle it separately
            return
          }
          
          if (fundId && fundId !== 'undefined' && fundId !== 'null' && moduleKey) {
            if (!permissionsObj[fundId]) {
              permissionsObj[fundId] = {}
            }
            permissionsObj[fundId][moduleKey] = {
              can_view: perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' || perm.can_view === 'true',
              can_add: perm.can_add === true || perm.can_add === 1 || perm.can_add === '1' || perm.can_add === 'true',
              can_edit: perm.can_edit === true || perm.can_edit === 1 || perm.can_edit === '1' || perm.can_edit === 'true',
              can_delete: perm.can_delete === true || perm.can_delete === 1 || perm.can_delete === '1' || perm.can_delete === 'true',
            }
          }
        })

        console.log('🔍 Edit Role - Processed data:', {
          orgId,
          fundIds,
          permissionsObj,
          roleFunds,
          rolePermissions: rolePermissions.length,
        })

        // Set org_id first so funds can be fetched
        setFormData(prev => ({
          ...prev,
          role_name: roleData.role_name || roleData.name || '',
          role_description: roleData.role_description || roleData.description || '',
          org_id: String(orgId),
          funds: fundIds,
          permissions: permissionsObj,
          fundModulePermissions: fundModulePerms,
        }))

        setLoadingOrgs(false)
        
        // After setting org_id, fetch funds for that org
        // This will be handled by the useEffect that watches formData.org_id
      } catch (error) {
        console.error('Error fetching role data:', error)
        setError('Failed to load role data')
      } finally {
        setLoading(false)
      }
    }

    fetchRoleData()
  }, [roleId])

  // Fetch modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true)
      try {
        const response = await api.get('/api/v1/module/')
        const data = response.data?.data || response.data || []
        setModules(data)
      } catch (error) {
        console.error('Error fetching modules:', error)
        setError('Failed to load modules')
      } finally {
        setLoadingModules(false)
      }
    }
    fetchModules()
  }, [])

  // Fetch funds when organization is selected
  useEffect(() => {
    const fetchFundsForOrg = async () => {
      if (!formData.org_id) {
        setFunds([])
        return
      }

      setLoadingFunds(true)
      try {
        // Fetch all funds from admin endpoint
        const data = await getAllFundsAdmin()
        const allFunds = data?.funds || data || []
        
        // Filter funds by organization_id
        const filteredFunds = allFunds.filter(fund => {
          if (fund.organization?.org_id) {
            return fund.organization.org_id === formData.org_id
          }
          if (fund.organization_id) {
            return fund.organization_id === formData.org_id
          }
          if (fund.org_id) {
            return fund.org_id === formData.org_id
          }
          return false
        })
        
        setFunds(filteredFunds)
      } catch (error) {
        console.error('Error fetching funds:', error)
        setError('Failed to load funds')
        setFunds([])
      } finally {
        setLoadingFunds(false)
      }
    }

    fetchFundsForOrg()
  }, [formData.org_id])

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset funds and permissions when organization changes
      ...(name === 'org_id' ? { funds: [], permissions: {} } : {})
    }))
  }

  // Handle fund checkbox changes
  const handleFundChange = (fundId, checked) => {
    setFormData(prev => {
      const currentFunds = prev.funds || []
      let newFunds, newPermissions = { ...prev.permissions }
      
      if (checked) {
        // Add fund ID if not already present
        newFunds = [...currentFunds, fundId]
        // Initialize permissions for this fund if not exists
        if (!newPermissions[fundId]) {
          newPermissions[fundId] = {}
        }
      } else {
        // Remove fund ID
        newFunds = currentFunds.filter(id => id !== fundId)
        // Remove permissions for this fund
        delete newPermissions[fundId]
      }
      
      return {
        ...prev,
        funds: newFunds,
        permissions: newPermissions
      }
    })
  }

  // Handle select all funds
  const handleSelectAllFunds = (checked) => {
    if (checked) {
      // Select all funds
      const allFundIds = funds.map(fund => fund.fund_id || fund.id)
      const newPermissions = { ...formData.permissions }
      
      // Initialize permissions for all funds
      allFundIds.forEach(fundId => {
        if (!newPermissions[fundId]) {
          newPermissions[fundId] = {}
        }
      })
      
      setFormData(prev => ({
        ...prev,
        funds: allFundIds,
        permissions: newPermissions
      }))
    } else {
      // Deselect all funds
      setFormData(prev => ({
        ...prev,
        funds: [],
        permissions: {}
      }))
    }
  }

  // Handle select all modules for a specific fund
  const handleSelectAllModules = (fundId, checked) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions }
      
      if (!newPermissions[fundId]) {
        newPermissions[fundId] = {}
      }
      
      if (checked) {
        // Select all modules with all permissions
        modules.forEach(module => {
          const moduleKey = module.module_key || module.key
          newPermissions[fundId][moduleKey] = {
            can_view: true,
            can_add: true,
            can_edit: true,
            can_delete: true
          }
        })
      } else {
        // Deselect all modules
        newPermissions[fundId] = {}
      }
      
      return {
        ...prev,
        permissions: newPermissions
      }
    })
  }

  // Handle fund module permission changes
  const handleFundModulePermissionChange = (permissionType, checked) => {
    setFormData(prev => ({
      ...prev,
      fundModulePermissions: {
        ...prev.fundModulePermissions,
        [permissionType]: checked
      }
    }))
  }

  // Handle permission checkbox changes - fund-specific
  const handlePermissionChange = (fundId, moduleKey, permissionType, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [fundId]: {
          ...prev.permissions[fundId],
          [moduleKey]: {
            ...prev.permissions[fundId]?.[moduleKey],
            [permissionType]: checked,
          }
        }
      }
    }))
  }

  // Handle apply module permissions to all funds
  const handleApplyToAllFunds = (sourceFundId, moduleKey) => {
    setFormData(prev => {
      const sourcePermissions = prev.permissions[sourceFundId]?.[moduleKey] || {}
      const newPermissions = { ...prev.permissions }
      
      // Apply source fund's module permissions to all other selected funds
      prev.funds.forEach(fundId => {
        if (fundId !== sourceFundId) {
          if (!newPermissions[fundId]) {
            newPermissions[fundId] = {}
          }
          newPermissions[fundId][moduleKey] = { ...sourcePermissions }
        }
      })
      
      return {
        ...prev,
        permissions: newPermissions
      }
    })
  }

  // Handle apply all modules from one fund to all other funds
  const handleApplyAllModulesToAllFunds = (sourceFundId) => {
    setFormData(prev => {
      const sourcePermissions = prev.permissions[sourceFundId] || {}
      const newPermissions = { ...prev.permissions }
      
      // Apply source fund's all module permissions to all other selected funds
      prev.funds.forEach(fundId => {
        if (fundId !== sourceFundId) {
          if (!newPermissions[fundId]) {
            newPermissions[fundId] = {}
          }
          // Copy all modules from source fund
          Object.keys(sourcePermissions).forEach(moduleKey => {
            newPermissions[fundId][moduleKey] = { ...sourcePermissions[moduleKey] }
          })
        }
      })
      
      return {
        ...prev,
        permissions: newPermissions
      }
    })
  }

  // Transform form data to API format for basic role update
  const transformBasicRoleData = () => {
    const { role_name, role_description } = formData
    return {
      role_name,
      role_description,
    }
  }

  // Transform form data to API format for permissions update
  const transformPermissionsData = () => {
    const { funds, permissions, fundModulePermissions } = formData
    
    // Build permissions array
    const permissionsArray = []
    
    // Add fund module permissions (apply to all funds)
    if (funds.length > 0) {
      funds.forEach(fundId => {
        if (fundModulePermissions.can_add || fundModulePermissions.can_edit || fundModulePermissions.can_delete) {
          permissionsArray.push({
            fund_id: fundId,
            module_key: 'fund', // Use 'fund' as module_key for fund module
            can_view: true, // Always true since fundlist is always visible
            can_add: fundModulePermissions.can_add || false,
            can_edit: fundModulePermissions.can_edit || false,
            can_delete: fundModulePermissions.can_delete || false
          })
        }
      })
    }
    
    // Add other module permissions
    funds.forEach(fundId => {
      Object.keys(permissions[fundId] || {}).forEach(moduleKey => {
        // Skip 'fund' module_key if it exists in permissions (we handle it separately above)
        if (moduleKey.toLowerCase() === 'fund' || moduleKey.toLowerCase() === 'funds') return
        
        const perm = permissions[fundId][moduleKey]
        permissionsArray.push({
          fund_id: fundId,
          module_key: moduleKey,
          can_view: perm.can_view || false,
          can_add: perm.can_add || false,
          can_edit: perm.can_edit || false,
          can_delete: perm.can_delete || false
        })
      })
    })
    
    // API expects: { funds: [], permissions: [] }
    return {
      funds: funds,
      permissions: permissionsArray
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.role_name.trim()) {
      setError('Role name is required')
      return
    }

    if (!formData.org_id) {
      setError('Please select an organization')
      return
    }

    if (!formData.funds || formData.funds.length === 0) {
      setError('Please select at least one fund')
      return
    }

    // Check if at least one permission is set (including fund module permissions)
    let hasPermission = false
    
    // Check fund module permissions
    if (formData.fundModulePermissions.can_add || formData.fundModulePermissions.can_edit || formData.fundModulePermissions.can_delete) {
      hasPermission = true
    }
    
    // Check other module permissions
    if (!hasPermission) {
      formData.funds.forEach(fundId => {
        if (formData.permissions[fundId]) {
          Object.keys(formData.permissions[fundId]).forEach(moduleKey => {
            const perm = formData.permissions[fundId][moduleKey]
            if (perm.can_view || perm.can_add || perm.can_edit || perm.can_delete) {
              hasPermission = true
            }
          })
        }
      })
    }

    if (!hasPermission) {
      setError('Please set at least one permission')
      return
    }

    setSaving(true)
    try {
      // Step 1: Update basic role info (role_name, role_description)
      const basicRolePayload = transformBasicRoleData()
      console.log('🔍 Step 1: Updating basic role info - Payload:', basicRolePayload)
      
      await api.put(`/api/v1/roles/${roleId}`, basicRolePayload)
      console.log('✅ Basic role info updated successfully')

      // Step 2: Update role permissions and fund mappings
      const permissionsPayload = transformPermissionsData()
      console.log('🔍 Step 2: Updating role permissions - Payload:', JSON.stringify(permissionsPayload, null, 2))
      
      await api.put(`/api/v1/roles/${roleId}/permissions`, permissionsPayload)
      console.log('✅ Role permissions updated successfully')
      
      showNotification({
        message: 'Role updated successfully!',
        variant: 'success',
      })

      // Small delay before redirect to ensure update is processed
      setTimeout(() => {
        router.push('/roles')
      }, 500)
    } catch (error) {
      console.error('❌ Error updating role:', error)
      console.error('❌ Error response:', error?.response?.data)
      console.error('❌ Error status:', error?.response?.status)
      
      setError(error?.response?.data?.message || 'Failed to update role. Please try again.')
      showNotification({
        message: error?.response?.data?.message || 'Failed to update role.',
        variant: 'danger',
      })
    } finally {
      setSaving(false)
    }
  }

  // Get selected funds data
  const getSelectedFunds = () => {
    return funds.filter(fund => {
      const fundId = String(fund.fund_id || fund.id)
      return formData.funds?.some(f => String(f) === fundId) || false
    })
  }

  if (loading) {
    return (
      <>
        <PageTitle title="Edit Role" subName="Admin" />
        <Row>
          <Col xl={12}>
            <Card>
              <CardBody className="p-4 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Loading role data...</p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </>
    )
  }

  return (
    <>
      <PageTitle title="Edit Role" subName="Admin" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="border-bottom">
              <CardTitle as="h4">Edit Role</CardTitle>
            </CardHeader>
            <CardBody>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Role Name */}
                <Row>
                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <FormLabel>Role Name *</FormLabel>
                      <FormControl
                        type="text"
                        name="role_name"
                        value={formData.role_name}
                        onChange={handleChange}
                        placeholder="Enter role name"
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>

                {/* Description */}
                <Row>
                  <Col md={12}>
                    <FormGroup className="mb-3">
                      <FormLabel>Description</FormLabel>
                      <FormControl
                        as="textarea"
                        rows={3}
                        name="role_description"
                        value={formData.role_description}
                        onChange={handleChange}
                        placeholder="Enter role description"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                {/* Fund Module Permissions - Before Organization */}
                <Row>
                  <Col md={12}>
                    <FormGroup className="mb-3">
                      <FormLabel className="fw-bold">Fund Module - Can User Add Fund?</FormLabel>
                      <Card className="mt-2">
                        <CardBody>
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  <th>Permission</th>
                                  <th className="text-center">Allow</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="fw-semibold">Can Add Fund</td>
                                  <td className="text-center">
                                    <FormCheck
                                      type="checkbox"
                                      checked={formData.fundModulePermissions.can_add || false}
                                      onChange={(e) => handleFundModulePermissionChange('can_add', e.target.checked)}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="fw-semibold">Can Edit Fund</td>
                                  <td className="text-center">
                                    <FormCheck
                                      type="checkbox"
                                      checked={formData.fundModulePermissions.can_edit || false}
                                      onChange={(e) => handleFundModulePermissionChange('can_edit', e.target.checked)}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="fw-semibold">Can Delete Fund</td>
                                  <td className="text-center">
                                    <FormCheck
                                      type="checkbox"
                                      checked={formData.fundModulePermissions.can_delete || false}
                                      onChange={(e) => handleFundModulePermissionChange('can_delete', e.target.checked)}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <small className="text-muted">
                            Note: Fund list view is always available. These permissions control add/edit/delete actions.
                          </small>
                        </CardBody>
                      </Card>
                    </FormGroup>
                  </Col>
                </Row>

                {/* Organization Dropdown */}
                <Row>
                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <FormLabel>Organization *</FormLabel>
                      {loadingOrgs ? (
                        <div className="d-flex align-items-center gap-2">
                          <Spinner animation="border" size="sm" />
                          <span>Loading organizations...</span>
                        </div>
                      ) : (
                        <FormSelect
                          name="org_id"
                          value={formData.org_id}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Organization</option>
                          {organizations.map((org) => (
                            <option key={org.organization_id || org.id} value={org.organization_id || org.id}>
                              {org.organization_name || org.name}
                            </option>
                          ))}
                        </FormSelect>
                      )}
                    </FormGroup>
                  </Col>
                </Row>

                {/* Funds Selection (Multiple) */}
                <Row>
                  <Col md={12}>
                    <FormGroup className="mb-3">
                      <FormLabel>Select Funds *</FormLabel>
                      {loadingFunds ? (
                        <div className="d-flex align-items-center gap-2">
                          <Spinner animation="border" size="sm" />
                          <span>Loading funds...</span>
                        </div>
                      ) : (
                        <Card className="mt-2">
                          <CardBody>
                            {funds.length === 0 ? (
                              <p className="text-muted mb-0">No funds available for this organization</p>
                            ) : (
                              <>
                                <div className="mb-3 pb-2 border-bottom">
                                  <FormCheck
                                    type="checkbox"
                                    id="select-all-funds"
                                    label="Select All Funds"
                                    checked={funds.length > 0 && funds.every(fund => {
                                      const fundId = fund.fund_id || fund.id
                                      return formData.funds?.includes(fundId)
                                    })}
                                    onChange={(e) => handleSelectAllFunds(e.target.checked)}
                                    disabled={!formData.org_id}
                                    className="fw-semibold"
                                  />
                                </div>
                                <div className="row g-3">
                                  {funds.map((fund) => {
                                    const fundId = String(fund.fund_id || fund.id)
                                    // Ensure proper comparison by converting both to strings
                                    const isChecked = formData.funds?.some(f => String(f) === fundId) || false
                                    return (
                                      <Col md={4} key={fundId}>
                                        <FormCheck
                                          type="checkbox"
                                          id={`fund-${fundId}`}
                                          label={fund.fund_name || fund.name}
                                          checked={isChecked}
                                          onChange={(e) => handleFundChange(fundId, e.target.checked)}
                                          disabled={!formData.org_id}
                                        />
                                      </Col>
                                    )
                                  })}
                                </div>
                              </>
                            )}
                            {formData.funds && formData.funds.length > 0 && (
                              <div className="mt-3">
                                <small className="text-muted">
                                  {formData.funds.length} fund{formData.funds.length > 1 ? 's' : ''} selected
                                </small>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      )}
                    </FormGroup>
                  </Col>
                </Row>

                {/* Module Permissions - Per Fund */}
                {loadingModules ? (
                  <Row>
                    <Col md={12}>
                      <div className="d-flex align-items-center gap-2 p-3">
                        <Spinner animation="border" size="sm" />
                        <span>Loading modules...</span>
                      </div>
                    </Col>
                  </Row>
                ) : (
                  getSelectedFunds().map((fund) => {
                    const fundId = fund.fund_id || fund.id
                    const fundName = fund.fund_name || fund.name
                    
                    return (
                      <Row key={fundId} className="mb-4">
                        <Col md={12}>
                          <FormGroup>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <FormLabel className="fw-bold mb-0">{fundName} - Module Permissions</FormLabel>
                              <div className="d-flex align-items-center gap-3">
                                <FormCheck
                                  type="checkbox"
                                  id={`select-all-modules-${fundId}`}
                                  label="Select All Modules"
                                  checked={modules.length > 0 && modules.every(module => {
                                    const moduleKey = module.module_key || module.key
                                    const perm = formData.permissions[fundId]?.[moduleKey]
                                    return perm && perm.can_view && perm.can_add && perm.can_edit && perm.can_delete
                                  })}
                                  onChange={(e) => handleSelectAllModules(fundId, e.target.checked)}
                                  className="fw-semibold"
                                />
                                {formData.funds && formData.funds.length > 1 && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleApplyAllModulesToAllFunds(fundId)}
                                    title="Apply all modules from this fund to all other funds"
                                  >
                                    Apply to All Funds
                                  </Button>
                                )}
                              </div>
                            </div>
                            <Card className="mt-2">
                              <CardBody>
                                <div className="table-responsive">
                                  <table className="table table-bordered">
                                    <thead>
                                      <tr>
                                        <th>Module</th>
                                        {PERMISSION_TYPES.map(perm => (
                                          <th key={perm.key} className="text-center">
                                            {perm.label}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {modules.map((module) => {
                                        const moduleKey = module.module_key || module.key
                                        const moduleName = module.module_name || module.name || moduleKey
                                        const perm = formData.permissions[fundId]?.[moduleKey] || {}
                                        
                                        return (
                                          <tr key={module.module_id || module.id}>
                                            <td className="fw-semibold">{moduleName}</td>
                                            {PERMISSION_TYPES.map((permissionType) => (
                                              <td key={permissionType.key} className="text-center">
                                                <FormCheck
                                                  type="checkbox"
                                                  checked={perm[permissionType.key] || false}
                                                  onChange={(e) =>
                                                    handlePermissionChange(fundId, moduleKey, permissionType.key, e.target.checked)
                                                  }
                                                />
                                              </td>
                                            ))}
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </CardBody>
                            </Card>
                          </FormGroup>
                        </Col>
                      </Row>
                    )
                  })
                )}

                {/* Action Buttons */}
                <Row>
                  <Col md={12}>
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => router.push('/roles')}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Updating...
                          </>
                        ) : (
                          'Update Role'
                        )}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default EditRolePage
