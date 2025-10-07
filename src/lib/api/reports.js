// src/lib/api/reports.js
import api from './axios'

export const getChartOfAccounts = async (fundId) => {
  const url = `/api/v1/reports/${encodeURIComponent(fundId)}/chart-of-accounts`
  const res = await api.get(url)

  // Normalize: array can be at res.data OR res.data.data OR res.data.accounts
  const d = res.data
  const arr =
    Array.isArray(d) ? d
    : Array.isArray(d?.data) ? d.data
    : Array.isArray(d?.accounts) ? d.accounts
    : []

  return arr
}
