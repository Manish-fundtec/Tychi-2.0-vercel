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
  
  try {
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
  } catch (error) {
    // Handle axios errors (400, 500, etc.)
    console.error('[DeleteTrade] Error:', error)
    
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
      throw customError
    }
    
    // Re-throw if it's not an axios error
    throw error
  }
}

// Bulk delete trades
export const bulkDeleteTrades = async (tradeIds, skipValidation = false) => {
  if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
    throw new Error('tradeIds array is required and must not be empty')
  }
  
  // Get dashboard token from cookies
  const token = Cookies.get('dashboardToken')
  
  // Decode fund_id from token (same pattern as getAllTrades)
  const payload = decodeJwtPayload(token)
  const fund_id = payload?.fund_id
  
  if (!fund_id) {
    throw new Error('fund_id not found in token')
  }
  
  const requestBody = {
    trade_ids: tradeIds,
    fund_id: fund_id, // ✅ Backend expects fund_id (snake_case)
    skip_validation: skipValidation, // ✅ ADDED: Send skip_validation flag
  }
  
  console.log('[BulkDelete] Request:', {
    url: '/api/v1/trade/bulk/delete',
    method: 'DELETE',
    body: requestBody,
    tradeCount: tradeIds.length,
    fund_id: fund_id,
    skipValidation: skipValidation,
  })
  
  try {
    // Use api.request() for DELETE with body (axios.delete sometimes doesn't send body properly)
    const res = await api.request({
      method: 'DELETE',
      url: '/api/v1/trade/bulk/delete',
      withCredentials: true,
      headers: {
        'dashboard': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: requestBody,
    })
    
    // Backend response format:
    // 200: All deleted - { success: true, message: "...", results: { successful: [...], failed: [] } }
    // 207: Partial - { success: true, message: "...", results: { successful: [...], failed: [...] } }
    // 400: All failed - { success: false, message: "...", results: { successful: [], failed: [...] } }
    
    const responseData = res?.data || {}
    const results = responseData?.results || {}
    const successful = results?.successful || []
    const failed = results?.failed || []
    
    if (res.status === 200) {
      // All deleted successfully
      return {
        success: true,
        message: responseData?.message || 'All trades deleted successfully',
        successful: successful,
        failed: failed,
        partial: false,
      }
    } else if (res.status === 207) {
      // Partial success
      return {
        success: true,
        partial: true,
        message: responseData?.message || 'Some trades deleted successfully',
        successful: successful,
        failed: failed,
      }
    } else {
      // All failed or error - but still return results if available
      // This allows frontend to show detailed error messages
      if (failed.length > 0 || successful.length > 0) {
        return {
          success: false,
          partial: false,
          message: responseData?.message || 'All trades failed to delete',
          successful: successful,
          failed: failed,
        }
      }
      
      // No results available, throw error
      const errorMessage = responseData?.message || responseData?.error || 'Failed to delete trades'
      const error = new Error(errorMessage)
      error.response = res
      error.responseData = responseData
      throw error
    }
  } catch (error) {
    // Handle axios errors (400, 500, etc.)
    console.error('[BulkDelete] Error:', error)
    console.error('[BulkDelete] Error response:', error?.response)
    console.error('[BulkDelete] Error response.data:', error?.response?.data)
    
    // If it's an axios error with response, check if it has results
    if (error?.response) {
      const responseData = error.response?.data || {}
      const results = responseData?.results || {}
      const successful = results?.successful || []
      const failed = results?.failed || []
      
      console.log('[BulkDelete] Checking response data:', {
        hasResponseData: !!responseData,
        hasResults: !!responseData?.results,
        failedCount: failed.length,
        successfulCount: successful.length,
        responseDataKeys: Object.keys(responseData),
        resultsKeys: Object.keys(results)
      })
      
      // If backend returned results (even with 400 status), return them instead of throwing
      // This happens when all trades fail but backend still provides detailed error info
      // Check if results object exists (even if arrays are empty)
      if (responseData?.results !== undefined) {
        console.log('[BulkDelete] Returning results instead of throwing error', {
          message: responseData?.message,
          failedCount: failed.length,
          successfulCount: successful.length
        })
        return {
          success: false,
          partial: false,
          message: responseData?.message || 'All trades failed to delete',
          successful: successful,
          failed: failed,
        }
      }
      
      // No results available, throw error
      const errorMessage = 
        responseData?.message || 
        responseData?.error || 
        `Request failed with status ${error.response.status}`
      
      const customError = new Error(errorMessage)
      customError.response = error.response
      customError.responseData = responseData
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
