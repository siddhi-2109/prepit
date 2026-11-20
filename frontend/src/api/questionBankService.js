
import apiClient from "./apiClient";

// GET: Fetch all Question Bank questions
export async function getQuestionBank(filters = {}) {
  try {
    const response = await apiClient.get(
      "/interviews/question-bank/",
      {
        params: filters,
      }
    );

    const data = response.data;

    // Handle normal Django REST Framework response
    if (Array.isArray(data)) {
      return data;
    }

    // Handle paginated response
    if (Array.isArray(data.results)) {
      return data.results;
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch Question Bank:", error);
    throw error;
  }
}

// PATCH: Save bookmark status
export async function updateBookmark(questionId, isBookmarked) {
  try {
    const response = await apiClient.patch(
      `/interviews/question-bank/${questionId}/progress/`,
      {
        is_bookmarked: isBookmarked,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to update bookmark:", error);
    throw error;
  }
}

// PATCH: Save practice status
export async function updatePracticeStatus(questionId, isPracticed) {
  try {
    const response = await apiClient.patch(
      `/interviews/question-bank/${questionId}/progress/`,
      {
        is_practiced: isPracticed,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to update practice status:", error);
    throw error;
  }
}
