// hooks/useUserToken.js
"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

export const useUserToken = () => {
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    let token = null;

    // Prefer localStorage (since cookies aren’t passing cross-site)
    if (typeof window !== "undefined") {
      token = localStorage.getItem("userToken");
    }

    // Fallback to cookie if present (for legacy flows)
    if (!token) {
      token = Cookies.get("userToken");
    }

    console.log("🔐 token for decode (storage>cookie):", token ? "[present]" : "[missing]");

    if (!token) {
      setTokenData(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log("🧩 Decoded userToken:", decoded);
      setTokenData(decoded);
    } catch (err) {
      console.warn("⚠️ Invalid userToken:", err);
      setTokenData(null);
    }
  }, []);

  return tokenData;
};


// 'use client';
// import { useEffect, useState } from 'react';
// import Cookies from 'js-cookie';
// import { jwtDecode } from 'jwt-decode'; // ✅ FIXED

// export const useUserToken = () => {
//   const [tokenData, setTokenData] = useState(null);

//   useEffect(() => {
//     const token = Cookies.get('userToken');
//     console.log('🔐 userToken from cookies:', token);

//     if (token) {
//       try {
//         const decoded = jwtDecode(token); // ✅ FIXED
//         console.log('🧩 Decoded userToken:', decoded);
//         setTokenData(decoded);
//       } catch (err) {
//         console.warn('⚠️ Invalid userToken:', err);
//         setTokenData(null);
//       }
//     } else {
//       console.warn('⚠️ No userToken found in cookies');
//     }
//   }, []);

//   return tokenData;
// };
