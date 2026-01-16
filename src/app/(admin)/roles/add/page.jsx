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
import { fetchFunds } from '@/lib/api/fund'

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
    fund_id: '',
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
        const data = await fetchFunds()
        const allFunds = data?.funds || data || []
        
        // Filter funds by organization_id if available
        // If fund has org_id field, filter by it, otherwise show all funds
        const filteredFunds = allFunds.filter(fund => {
          // Check if fund has organization_id or org_id field
          return fund.organization_id === formData.organization_id || 
                 fund.org_id === formData.organization_id ||
                 !fund.organization_id // If no org_id, show all (fallback)
        })
        
        setFunds(filteredFunds.length > 0 ? filteredFunds : allFunds)
      } catch (error) {
        console.error('Error fetching funds:', error)
        setError('Failed to load funds')
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
      // Reset fund_id when organization changes
      ...(name === 'organization_id' ? { fund_id: '' } : {})
    }))
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

    if (!formData.fund_id) {
      setError('Please select a fund')
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
        fund_id: formData.fund_id,
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

                {/* Funds Dropdown */}
                <Row>
                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <FormLabel>Fund *</FormLabel>
                      {loadingFunds ? (
                        <div className="d-flex align-items-center gap-2">
                          <Spinner animation="border" size="sm" />
                          <span>Loading funds...</span>
                        </div>
                      ) : (
                        <FormSelect
                          name="fund_id"
                          value={formData.fund_id}
                          onChange={handleChange}
                          required
                          disabled={!formData.organization_id || funds.length === 0}
                        >
                          <option value="">Select Fund</option>
                          {funds.map((fund) => (
                            <option key={fund.fund_id || fund.id} value={fund.fund_id || fund.id}>
                              {fund.fund_name || fund.name}
                            </option>
                          ))}
                        </FormSelect>
                      )}
                      {formData.organization_id && funds.length === 0 && !loadingFunds && (
                        <small className="text-muted">No funds available for this organization</small>
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
