// lib/swrFetcher.js
import api from '../lib/api/axios';
export const fetcher = (url) => api.get(url).then(r => r.data);
