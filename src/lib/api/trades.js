import api from './axios'
import Cookies from 'js-cookie'

// Tiny safe JWT payload decoder (no external jwt-decode)
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export const getAllTrades = async () => {
  // 1) Read token from cookies (client-side)
  const token = Cookies.get('dashboardToken') // or 'userToken' if that’s your source
  if (!token) throw new Error('Missing dashboardToken')

  // 2) Decode fund_id from token (no hooks)
  const payload = decodeJwtPayload(token)
  const fund_id = payload?.fund_id
  if (!fund_id) throw new Error('fund_id not found in token')

  // 3) Hit your backend route
  const res = await api.get(`/api/v1/trade/fund/${fund_id}`)

  // 4) Return an array for AG Grid
  return res?.data?.data ?? []
}

export const deleteTrade = async (trade_id) => {
  if (!trade_id) throw new Error('trade_id is required')
  
  // Get dashboard token from cookies
  const token = Cookies.get('dashboardToken')
  
  const res = await api.delete(`/api/v1/trade/${trade_id}`, {
    withCredentials: true, // keep if your backend checks cookies/JWT
    headers: {
      'dashboard': `Bearer ${token}`, // manually attach token in headers
      'Content-Type': 'application/json',
    },
  })
  if (!res?.data?.success) {
    throw new Error(res?.data?.message || 'Failed to delete trade')
  }
  return res.data // { success, message, details }
}

// Bulk delete trades
export const bulkDeleteTrades = async (tradeIds) => {
  if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
    throw new Error('tradeIds array is required and must not be empty')
  }
  
  // Get dashboard token from cookies
  const token = Cookies.get('dashboardToken')
  
  const requestBody = {
    tradeIds: tradeIds, // Changed from trade_ids to tradeIds for consistency
  }
  
  console.log('[BulkDelete] Request:', {
    url: '/api/trades/bulk/delete',
    method: 'POST',
    body: requestBody,
    tradeCount: tradeIds.length,
  })
  
  try {
    // Call Next.js API endpoint
    const res = await api.request({
      method: 'POST',
      url: '/api/trades/bulk/delete',
      withCredentials: true,
      headers: {
        'dashboard': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: requestBody,
    })
    
    // New API response format:
    // 200: { success: true, message: "...", data: { deleted_count: N, requested_count: M } }
    // 400: { success: false, message: "...", issues: [...] }
    // 500: { success: false, message: "...", error: "..." }
    
    const responseData = res?.data || {}
    
    if (res.status === 200 && responseData?.success) {
      // All deleted successfully
      const deletedCount = responseData?.data?.deleted_count || 0
      const requestedCount = responseData?.data?.requested_count || tradeIds.length
      
      return {
        success: true,
        message: responseData?.message || `Successfully deleted ${deletedCount} trade(s)`,
        deleted_count: deletedCount,
        requested_count: requestedCount,
        partial: false,
      }
    } else {
      // Error - extract error message and validation issues
      const errorMessage = responseData?.message || responseData?.error || 'Failed to delete trades'
      const issues = responseData?.issues || []
      
      const error = new Error(errorMessage)
      error.response = res
      error.responseData = responseData
      error.validationIssues = issues
      throw error
    }
  } catch (error) {
    // Handle axios errors (400, 500, etc.)
    console.error('[BulkDelete] Error:', error)
    
    // If it's an axios error with response, extract the message
    if (error?.response) {
      const responseData = error.response?.data || {}
      const errorMessage = 
        responseData?.message || 
        responseData?.error || 
        `Request failed with status ${error.response.status}`
      
      const customError = new Error(errorMessage)
      customError.response = error.response
      customError.responseData = responseData
      
      // Include validation issues if present (for continuous delete validation)
      if (responseData?.issues && Array.isArray(responseData.issues)) {
        customError.validationIssues = responseData.issues
        
        // Format validation issues for display
        const issueMessages = responseData.issues.map(issue => 
          `• Symbol: ${issue.symbol_id}\n  ${issue.message}\n  (Total: ${issue.total_trades}, Selected: ${issue.selected})\n  ${issue.hint}`
        ).join('\n\n')
        
        if (issueMessages) {
          customError.detailedMessage = `${errorMessage}\n\n${issueMessages}`
        }
      }
      
      throw customError
    }
    
    // Re-throw if it's not an axios error
    throw error
  }
}

// NEW: Add trade (POST /api/v1/trade)
export async function addTrade(payload) {
  // Ensure org_id exists (backend requires it)
  // const { org_id: tokenOrgId } = getIdsFromToken()
   // ✅ Make sure token exists
   const token = Cookies.get('dashboardToken');
   console.log('Bearer token:', token);
   
  const body = {
    ...payload,
    org_id: payload.org_id ?? tokenOrgId,
    file_row_no: 1, // always 1 as requested
  }

  const res = await api.post('/api/v1/trade', body, {
    headers: {
      'dashboard': `Bearer ${token}`, // manually attach token
      'Content-Type': 'application/json', // optional but good
    },
  })
  
  if (res?.data?.success === false) {
    throw new Error(res?.data?.message || 'Trade creation failed')
  }
  return res.data
}
