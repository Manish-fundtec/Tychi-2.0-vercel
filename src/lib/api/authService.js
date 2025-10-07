import axios from 'axios';

const API = process.env.NEXT_PUBLIC_AUTH_API_URL;
console.log("API Base URL:", API);

export const loginUser = async (data) => {
  try {
    // Make the POST request with the user credentials (email and password)
    const res = await axios.post(`${API}/login`, data);

    if (res.data.message === "Login successful") {
      // Store tokens or do something with the login response
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('idToken', res.data.idToken);

      // Check if there's a redirectTo URL in the response or in the query
      const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/fundlist';

      // Redirect to the dashboard or the page user was trying to access
      window.location.href = redirectTo;
    }
    return res.data;
  } catch (error) {
    // Add detailed logging for debugging
    console.error("Login error:", error.response || error);
    if (error.response) {
      // If the error has a response (e.g., 401 Unauthorized)
      console.error("Error Response Data:", error.response.data);
      console.error("Error Response Status:", error.response.status);
      console.error("Error Response Headers:", error.response.headers);
    }
    return { message: "Login failed", error: error.response?.data || error.message };
  }
};

export const registerUser = async (data) => {
  try {
    const res = await axios.post(`${API}/register`, data);
    return res.data;
  } catch (error) {
    console.error("Registration error:", error.response || error);
    return { message: "Registration failed", error: error.response?.data || error.message };
  }
};
