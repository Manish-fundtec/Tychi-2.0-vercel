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

const MODULES = [
  { key: 'trade', label: 'Trade' },
  { key: 'configuration', label: 'Configuration' },
  { key: 'reports', label: 'Reports' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'general_ledger', label: 'General Ledger' },
]

const PERMISSIONS = ['view', 'edit', 'add', 'delete']

const AddRolePage = () => {
  const router = useRouter()
  const { showNotification } = useNotificationContext()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [funds, setFunds] = useState([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [loadingFunds, setLoadingFunds] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    role_name: '',
    role_description: '',
    organization_id: '',
    fund_ids: [], // Array of selected fund IDs
    permissions: {} // { module_key: { view: true, edit: false, add: false, delete: false } }
  })

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true)
      try {
        const response = await api.get('/api/v1/organization')
        const data = response.data?.data || response.data || []
        setOrganizations(data)
      } catch (error) {
        console.error('Error fetching organizations:', error)
        setError('Failed to load organizations')
      } finally {
        setLoadingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  // Fetch funds when organization is selected
  useEffect(() => {
    const fetchFundsForOrg = async () => {
      if (!formData.organization_id) {
        setFunds([])
        return
      }

      setLoadingFunds(true)
      try {
        // Fetch all funds from admin endpoint
        const data = await getAllFundsAdmin()
        const allFunds = data?.funds || data || []
        
        // Filter funds by organization_id
        // Backend returns funds with organization object: { organization: { org_id, org_name } }
        // or direct fields: organization_id, org_id
        const filteredFunds = allFunds.filter(fund => {
          // Check nested organization object
          if (fund.organization?.org_id) {
            return fund.organization.org_id === formData.organization_id
          }
          // Check direct organization_id field
          if (fund.organization_id) {
            return fund.organization_id === formData.organization_id
          }
          // Check org_id field
          if (fund.org_id) {
            return fund.org_id === formData.organization_id
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
  }, [formData.organization_id])

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset fund_ids when organization changes
      ...(name === 'organization_id' ? { fund_ids: [] } : {})
    }))
  }

  // Handle fund checkbox changes
  const handleFundChange = (fundId, checked) => {
    setFormData(prev => {
      const currentFundIds = prev.fund_ids || []
      if (checked) {
        // Add fund ID if not already present
        return {
          ...prev,
          fund_ids: [...currentFundIds, fundId]
        }
      } else {
        // Remove fund ID
        return {
          ...prev,
          fund_ids: currentFundIds.filter(id => id !== fundId)
        }
      }
    })
  }

  // Handle permission checkbox changes
  const handlePermissionChange = (moduleKey, permission, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [permission]: checked,
        }
      }
    }))
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

    if (!formData.organization_id) {
      setError('Please select an organization')
      return
    }

    if (!formData.fund_ids || formData.fund_ids.length === 0) {
      setError('Please select at least one fund')
      return
    }

    setSaving(true)
    try {
      // Prepare permissions array for API
      const permissionsArray = []
      Object.keys(formData.permissions).forEach(moduleKey => {
        const modulePerms = formData.permissions[moduleKey]
        Object.keys(modulePerms).forEach(permission => {
          if (modulePerms[permission]) {
            permissionsArray.push({
              module: moduleKey,
              permission: permission,
            })
          }
        })
      })

      // Prepare payload
      const payload = {
        role_name: formData.role_name,
        role_description: formData.role_description,
        organization_id: formData.organization_id,
        fund_ids: formData.fund_ids, // Array of fund IDs
        permissions: permissionsArray,
      }

      // Submit to API
      await api.post('/api/v1/roles', payload)
      
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
                          name="organization_id"
                          value={formData.organization_id}
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
                              <div className="row g-3">
                                {funds.map((fund) => {
                                  const fundId = fund.fund_id || fund.id
                                  const isChecked = formData.fund_ids?.includes(fundId) || false
                                  return (
                                    <Col md={4} key={fundId}>
                                      <FormCheck
                                        type="checkbox"
                                        id={`fund-${fundId}`}
                                        label={fund.fund_name || fund.name}
                                        checked={isChecked}
                                        onChange={(e) => handleFundChange(fundId, e.target.checked)}
                                        disabled={!formData.organization_id}
                                      />
                                    </Col>
                                  )
                                })}
                              </div>
                            )}
                            {formData.fund_ids && formData.fund_ids.length > 0 && (
                              <div className="mt-3">
                                <small className="text-muted">
                                  {formData.fund_ids.length} fund{formData.fund_ids.length > 1 ? 's' : ''} selected
                                </small>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      )}
                    </FormGroup>
                  </Col>
                </Row>

                {/* Module Permissions */}
                <Row>
                  <Col md={12}>
                    <FormGroup className="mb-4">
                      <FormLabel className="fw-bold">Module Permissions</FormLabel>
                      <Card className="mt-2">
                        <CardBody>
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  <th>Module</th>
                                  {PERMISSIONS.map(perm => (
                                    <th key={perm} className="text-center text-capitalize">
                                      {perm}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {MODULES.map((module) => (
                                  <tr key={module.key}>
                                    <td className="fw-semibold">{module.label}</td>
                                    {PERMISSIONS.map((permission) => (
                                      <td key={permission} className="text-center">
                                        <FormCheck
                                          type="checkbox"
                                          checked={formData.permissions[module.key]?.[permission] || false}
                                          onChange={(e) =>
                                            handlePermissionChange(module.key, permission, e.target.checked)
                                          }
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardBody>
                      </Card>
                    </FormGroup>
                  </Col>
                </Row>

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
