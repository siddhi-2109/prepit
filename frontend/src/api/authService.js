
import apiClient from "./apiClient";

// REGISTER A NEW USER
export async function registerUser(userData) {
  const response = await apiClient.post(
    "/auth/register/",
    userData
  );

  return response.data;
}

// LOGIN USER
export async function loginUser(credentials) {
  const response = await apiClient.post(
    "/auth/token/",
    credentials
  );

  // Save JWT tokens for the current browser session
  sessionStorage.setItem("accessToken", response.data.access);
  sessionStorage.setItem("refreshToken", response.data.refresh);

  return response.data;
}

// LOGOUT USER
export function logoutUser() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
}

// CHECK LOGIN STATUS
export function isUserLoggedIn() {
  return Boolean(sessionStorage.getItem("accessToken"));
}

// GET USER PROFILE
export async function getMyProfile() {
  const response = await apiClient.get("/profile/");

  return response.data;
}
