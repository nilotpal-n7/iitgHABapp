import axios from "axios";
import { API_BASE_URL } from "./apis";

// Initialize global axios defaults (affects other imports of axios)
axios.defaults.baseURL = API_BASE_URL;

export function setAuthToken(token) {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

export function clearAuthToken() {
  delete axios.defaults.headers.common["Authorization"];
}

// Response interceptor: try a single refresh attempt on 401 (best-effort)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // Avoid infinite loop
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Best-effort refresh call. Backend must implement /auth/refresh for this to work.
        const resp = await axios.post(
          "/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = resp.data?.token;
        if (newToken) {
          setAuthToken(newToken);
          localStorage.setItem("token", newToken);
          processQueue(null, newToken);
          return axios(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
