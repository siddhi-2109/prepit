
import apiClient from "./apiClient";

export async function getUserSettings() {
  const response = await apiClient.get("/settings/");
  return response.data;
}

export async function updateUserSettings(data) {
  const response = await apiClient.patch("/settings/", data);
  return response.data;
}

export async function changeUserPassword(data) {
  const response = await apiClient.post("/auth/change-password/", data);
  return response.data;
}

const accentColors = {
  blue: "#477FAE",
  violet: "#8064B5",
  teal: "#278A83",
  rose: "#C16D87",
};

export function applyAppearance(settings = {}) {
  const root = document.documentElement;
  const preference = settings.theme || "system";

  const isDark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  root.dataset.theme = isDark ? "dark" : "light";
  root.dataset.themePreference = preference;
  root.dataset.density = settings.density || "comfortable";

  root.style.setProperty(
    "--prep-accent",
    accentColors[settings.accent_color] || accentColors.blue
  );
}
