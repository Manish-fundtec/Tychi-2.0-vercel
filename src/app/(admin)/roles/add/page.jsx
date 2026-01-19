'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

const AddRolePage = () => {
  const router = useRouter()
  const { showNotification } = useNotificationContext()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [funds, setFunds] = useState([])
  const [modules, setModules] = useState([])
  const [loadingFunds, setLoadingFunds] = useState(true)
  const [loadingModules, setLoadingModules] = useState(true)
  const [error, setError] = useState('')

  // Form state - matching guide structure
  const [formData, setFormData] = useState({
    role_name: '',
    role_description: '',
    funds: [], // Array of selected fund IDs
    permissions: {} // { fundId: { moduleKey: { can_view, can_add, can_edit, can_delete } } }
  })

  // Fetch funds on mount
  useEffect(() => {
    const fetchFunds = async () => {
      setLoadingFunds(true)
      try {
        // Fetch all funds from admin endpoint
        const data = await getAllFundsAdmin()
        const allFunds = data?.funds || data || []
        setFunds(allFunds)
      } catch (error) {
        console.error('Error fetching funds:', error)
        setError('Failed to load funds')
        setFunds([])
      } finally {
        setLoadingFunds(false)
      }
    }
    fetchFunds()
  }, [])

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


  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  // Transform form data to API format (matching guide)
  const transformFormDataForAPI = () => {
    const { role_name, role_description, funds, permissions } = formData
    
    // Build permissions array
    const permissionsArray = []
    
    funds.forEach(fundId => {
      Object.keys(permissions[fundId] || {}).forEach(moduleKey => {
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
    
    return {
      role_name,
      role_description,
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

    if (!formData.funds || formData.funds.length === 0) {
      setError('Please select at least one fund')
      return
    }

    // Check if at least one permission is set
    let hasPermission = false
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

    if (!hasPermission) {
      setError('Please set at least one permission')
      return
    }

    setSaving(true)
    try {
      // Transform to API format
      const payload = transformFormDataForAPI()

      // Submit to API
      await api.post('/api/v1/roles/with-permissions', payload)
      
      showNotification({
        message: 'Role created successfully!',
        variant: 'success',
      })

      // Redirect back to roles page
      router.push('/roles')
    } catch (error) {
      console.error('Error creating role:', error)
      setError(error?.response?.data?.message || 'Failed to create role. Please try again.')
      showNotification({
        message: error?.response?.data?.message || 'Failed to create role.',
        variant: 'danger',
      })
    } finally {
      setSaving(false)
    }
  }

  // Get selected funds data
  const getSelectedFunds = () => {
    return funds.filter(fund => {
      const fundId = fund.fund_id || fund.id
      return formData.funds.includes(fundId)
    })
  }

  return (
    <>
      <PageTitle title="Add Role" subName="Admin" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="border-bottom">
              <CardTitle as="h4">Add New Role</CardTitle>
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
                              <p className="text-muted mb-0">No funds available</p>
                            ) : (
                              <div className="row g-3">
                                {funds.map((fund) => {
                                  const fundId = fund.fund_id || fund.id
                                  const isChecked = formData.funds?.includes(fundId) || false
                                  return (
                                    <Col md={4} key={fundId}>
                                      <FormCheck
                                        type="checkbox"
                                        id={`fund-${fundId}`}
                                        label={fund.fund_name || fund.name}
                                        checked={isChecked}
                                        onChange={(e) => handleFundChange(fundId, e.target.checked)}
                                      />
                                    </Col>
                                  )
                                })}
                              </div>
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
                            <FormLabel className="fw-bold">{fundName} - Module Permissions</FormLabel>
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
                            Saving...
                          </>
                        ) : (
                          'Save Role'
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

export default AddRolePage
