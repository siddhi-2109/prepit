
import axios from "axios";

// Django API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

// Create reusable Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Shared refresh request prevents multiple simultaneous refresh calls
let refreshPromise = null;

// Attach the current access token to each request
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = sessionStorage.getItem("accessToken");

    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired access tokens
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only handle authentication failures
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/token/")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = sessionStorage.getItem("refreshToken");

    // No refresh token available
    if (!refreshToken) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");

      return Promise.reject(error);
    }

    // Prevent retrying the same request repeatedly
    originalRequest._retry = true;

    try {
      // Reuse an ongoing refresh request if one exists
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${API_BASE_URL}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            },
            {
              timeout: 120000,
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          .then((response) => {
            const newAccessToken = response.data.access;

            if (!newAccessToken) {
              throw new Error("No access token returned by Django.");
            }

            sessionStorage.setItem(
              "accessToken",
              newAccessToken
            );

            // Save a rotated refresh token if Django provides one
            if (response.data.refresh) {
              sessionStorage.setItem(
                "refreshToken",
                response.data.refresh
              );
            }

            return newAccessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      // Wait for the new token
      const newAccessToken = await refreshPromise;

      // Retry the original failed request
      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);

    } catch (refreshError) {
      // Refresh token is expired or invalid
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");

      console.error(
        "Session expired. Please sign in again.",
        refreshError
      );

      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
