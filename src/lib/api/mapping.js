import api from './axios';

// ✅ Get all mappings for a specific fund_id
export const fetchMappingsByFund = async (fund_id) => {
  const res = await api.get(`/api/v1/mapping/${fund_id}`);
  return res.data;
};

// ✅ Update GL codes for a specific mapping (by fund_id and mapping_id)
export const updateMappingGLCodes = async ({ fund_id, mapping_id, gl_code_long, gl_code_short, gl_code_setoff }) => {
  const res = await api.put(`/api/v1/mapping/${fund_id}/${mapping_id}`, {
    gl_code_long,
    gl_code_short,
    gl_code_setoff,
  });
  return res.data;
};
