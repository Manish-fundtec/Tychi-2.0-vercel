import Cookies from 'js-cookie';

import jwtDecode from 'jwt-decode';

export function getFundIdFromToken() {

  try {

    const token = Cookies.get('dashboardToken');

    if (!token) return null;

    const { fund_id } = jwtDecode(token) || {};

    return fund_id || null;

  } catch {

    return null;

  }

}
