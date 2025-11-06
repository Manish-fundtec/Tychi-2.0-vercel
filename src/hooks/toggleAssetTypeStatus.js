// hooks/useAssetTypeData.js (excerpt)
import axios from 'axios';
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export function useAssetTypeData() {
  // ...existing state & loaders

  const toggleAssetTypeStatus = async (assettype_id, nextStatus, fund_id) => {
    // The backend prefers fund_id from DashboardToken; we still pass it
    const { data } = await api.put(`/api/v1/asset-types/${assettype_id}`, {
      status: nextStatus,       // 'Active' | 'Inactive'
      fund_id,                  // optional (server can read from token)
      // include closure_rule / long_term_rule if you edit them in the modal
    });
    // optionally refresh list here (or let your existing polling/state handle it)
    return data;
  };

  return {
    assetTypes,
    toggleAssetTypeStatus,
    // ...others
  };
}
