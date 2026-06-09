import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("instrument_testing_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error("Unable to reach server. Please check network or backend status."));
    }

    if (error.response.status === 401) {
      localStorage.removeItem("instrument_testing_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
