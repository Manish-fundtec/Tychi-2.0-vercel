// lib/api/chartofaccounts.js
import api from './axios';

export const fetchGLCodesByFund = async (fundId) => {
  const response = await api.get(`/api/v1/chart-of-accounts/fund/${fundId}`);
  return response.data.data.map((gl) => ({
    value: gl.gl_code,
    label: `${gl.gl_code} - ${gl.gl_name}`
  }));
};
