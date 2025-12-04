import Cookies from 'js-cookie'
import api from './axios'

// Simple function to upload migration file
export const uploadMigrationFile = (file) => {
  // Create FormData to send file
  const formData = new FormData()
  formData.append('file', file)

  // Get token from cookie
  const token = Cookies.get('dashboardToken')

  // Send file to backend API
  // Backend will handle S3 upload to 'migration' folder
  return api.post('/api/v1/migration/trialbalance/upload', formData, {
    headers: {
      'dashboard': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  })
}

// Get migration data for a fundimage.png
export const getMigrationData = (fundId) => {
  return api.get(`/api/v1/migration/fund/${fundId}`)
}

// Get migration table data for a fund (migration records/metadata)
// Endpoint: GET /api/v1/migration/trialbalance/:fund_id/migration
export const getMigrationTableData = (fundId, fileId = null) => {
  // Build URL with query parameters
  let url = `/api/v1/migration/trialbalance/${encodeURIComponent(fundId)}/migration`
  if (fileId) {
    url += `?file_id=${encodeURIComponent(fileId)}`
  }
  
  // Use api.get() directly - axios interceptor handles Authorization header automatically
  return api.get(url)
}

// Mark migration file status as PENDING (simple API call)
export const markMigrationAsPending = (fundId, fileId) => {
  const token = Cookies.get('dashboardToken')
  const payload = {}
  
  // Only include file_id if provided, otherwise backend uses latest file
  if (fileId) {
    payload.file_id = fileId
  }
  
  return api.post(`/api/v1/migration/trialbalance/${fundId}/pending`, payload, {
    headers: {
      'dashboard': `Bearer ${token}`,
      'Content-Type': 'application/json', 
    },
  })
}

// Bookclose migration - Update reporting_period, reconcile_status, and bookclose_status
export const bookcloseMigration = (fundId, fileId, reportingPeriod) => {
  const token = Cookies.get('dashboardToken')
  const payload = {
    reporting_period: reportingPeriod,
    reconcile_status: 'reconciled',
    bookclose_status: 'bookclosed'
  }
  
  // Only include file_id if provided, otherwise backend uses latest file
  if (fileId) {
    payload.file_id = fileId
  }
  
  return api.post(`/api/v1/migration/trialbalance/${fundId}/bookclose`, payload, {
    headers: {
      'dashboard': `Bearer ${token}`,
    },
  })
}

// Open bookclose - Change bookclose_status from bookclosed to open
export const openBookclose = (fundId, fileId) => {
  const token = Cookies.get('dashboardToken')
  const payload = {
    bookclose_status: 'open'
  }
  
  // Only include file_id if provided, otherwise backend uses latest file
  if (fileId) {
    payload.file_id = fileId
  }
  
  return api.post(`/api/v1/migration/trialbalance/${fundId}/open`, payload, {
    headers: {
      'dashboard': `Bearer ${token}`,
    },
  })
}


