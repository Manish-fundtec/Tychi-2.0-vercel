import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

/**
 * Reads `reporting_start_date` from the "dashboardToken" cookie.
 * Returns a normalized YYYY-MM-DD string or null if missing/invalid.
 */

export function getReportingStartDateFromToken() {
  try {
    const token = Cookies.get("dashboardToken");
    console.log('🔑 Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No dashboardToken found in cookies');
      return null;
    }

    // jwtDecode can throw, so keep in try/catch
    const payload = jwtDecode(token) || {};
    console.log('📦 Decoded payload:', payload);
    
    // Common keys people use: reporting_start_date, reportingStartDate, RSD, fund_start_date
    const raw = payload.reporting_start_date || payload.reportingStartDate || payload.RSD || payload.fund_start_date;
    console.log('📅 Raw reporting start date value:', raw);
    
    if (!raw) {
      console.log('❌ No reporting_start_date found in token. Available keys:', Object.keys(payload));
      return null;
    }

    // Normalize to YYYY-MM-DD (strip time if present)
    const match = String(raw).match(/^(\d{4}-\d{2}-\d{2})/);
    const result = match ? match[1] : null;
    console.log('✅ Normalized reporting start date:', result);
    return result;
  } catch (error) {
    console.error('❌ Error reading reporting start date from token:', error);
    return null;
  }
}
