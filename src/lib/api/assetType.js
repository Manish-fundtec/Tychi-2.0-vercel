import api from './axios'

export const getAssetTypes = (fund_id) => {
  return api.get(`/api/v1/asset-types/fund/${fund_id}`) // Adjusted to match the new route
}
export const updateAssetTypeStatus = async (assettype_id, status, fund_id) => {
  try {
    return await api.put(`/api/v1/asset-types/${assettype_id}/status`, { status, fund_id })
  } catch (err) {
    const statusCode = err?.response?.status
    const data = err?.response?.data
    // Bubble up a normalized error
    throw {
      status: statusCode,
      code: data?.error || 'UNKNOWN',
      message: data?.message || 'Failed to update status',
      details: data?.details || null,
      raw: err,
    }
  }
}
export const updateAssetType = async (assettype_id, data) => {
  return await api.put(`/api/v1/asset-types/${assettype_id}`, data)
}
export const getAssetTypesActive = (fund_id) => {
  return api.get(`/api/v1/asset-types/fund/${fund_id}/active`)
}

export const deleteCoaSeedByAssetType = async (assettype_id, fund_id) => {
  return await api.delete(`/api/v1/chart-of-accounts/asset-types/${assettype_id}`, {
    data: { fund_id },
  })
}
