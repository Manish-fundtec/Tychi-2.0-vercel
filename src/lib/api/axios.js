// lib/api/axios.js
import axios from "axios";

// Prefer storing your token in memory or localStorage (not cookies for cross-site).
export function getAuthToken() {
  // try memory/global store first if you have one (e.g., Zustand/Redux)
  // then fallback to localStorage
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("userToken");
    if (t) return t;
  }
  return null;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. https://api.dev.tychi.co
  withCredentials: false, // important: we're not using cookies
});

// read token per-request (no top-level variable!)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('userToken');
    if (t) (config.headers ||= {}).Authorization = `Bearer ${t}`;
  }
  return config;
});

export default api;


// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
//   withCredentials: true,
// });


// export default api;
