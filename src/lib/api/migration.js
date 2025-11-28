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

// Get migration data for a fund
export const getMigrationData = (fundId) => {
  return api.get(`/api/v1/migration/fund/${fundId}`)
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
    },
  })
}


