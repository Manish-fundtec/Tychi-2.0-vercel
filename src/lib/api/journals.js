import api from '../api/axios'

export async function fetchJournals(fund_id) {
  if (!fund_id) throw new Error('fund_id is required to fetch journals')
  const { data } = await api.get(`/api/v1/journals/fund/${fund_id}`)
  return Array.isArray(data?.data) ? data.data : []
}
