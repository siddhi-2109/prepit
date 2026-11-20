import apiClient from "./apiClient";

// Fetch all published learning paths
export async function getLearningPaths() {
  const response = await apiClient.get("/learning-paths/");
  const data = response.data;

  return Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];
}

// Fetch one learning path and its modules
export async function getLearningPath(slug) {
  const response = await apiClient.get(`/learning-paths/${slug}/`);
  return response.data;
}

// Enroll in a learning path
export async function enrollLearningPath(slug) {
  const response = await apiClient.post(
    `/learning-paths/${slug}/enroll/`
  );
  return response.data;
}

// Mark a learning module complete or incomplete
export async function updateLearningModuleProgress(
  moduleId,
  isCompleted
) {
  const response = await apiClient.patch(
    `/learning-paths/modules/${moduleId}/progress/`,
    {
      is_completed: isCompleted,
    }
  );

  return response.data;
}