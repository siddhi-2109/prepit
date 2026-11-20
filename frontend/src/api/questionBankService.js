
import apiClient from "./apiClient";

// GET: Fetch questions from Django and PostgreSQL
export async function getQuestionBank() {
  try {
    const response = await apiClient.get(
      "/interviews/question-bank/"
    );

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.results)) {
      return data.results;
    }

    return [];
  } catch (error) {
    console.error("Question Bank loading failed:", error);
    throw error;
  }
}

// PATCH: Update bookmark or practice status
export async function updateQuestionProgress(questionId, changes) {
  try {
    const response = await apiClient.patch(
      `/interviews/question-bank/${questionId}/progress/`,
      changes
    );

    return response.data;
  } catch (error) {
    console.error("Question progress update failed:", error);
    throw error;
  }
}
