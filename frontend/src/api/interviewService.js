
import apiClient from "./apiClient";

// Get available interview domains
export async function getInterviewDomains() {
  const response = await apiClient.get("/interviews/domains/");

  return Array.isArray(response.data)
    ? response.data
    : response.data.results || [];
}

// Create interview session
export async function createInterviewSession(interviewData) {
  const response = await apiClient.post("/interviews/", interviewData);
  return response.data;
}

// Start interview and generate first question
export async function startInterviewSession(sessionId) {
  const response = await apiClient.post(
    `/interviews/${sessionId}/start/`
  );
  return response.data;
}

// Retrieve interview session
export async function getInterviewSession(sessionId) {
  const response = await apiClient.get(
    `/interviews/${sessionId}/`
  );
  return response.data;
}

// Retrieve conversation history
export async function getInterviewMessages(sessionId) {
  const response = await apiClient.get(
    `/interviews/${sessionId}/messages/`
  );

  return Array.isArray(response.data)
    ? response.data
    : response.data.results || [];
}

// Submit candidate answer
export async function submitInterviewAnswer(
  sessionId,
  questionId,
  content,
  messageMode = "text"
) {
  const response = await apiClient.post(
    `/interviews/${sessionId}/messages/`,
    {
      question: questionId,
      content,
      message_mode: messageMode,
    }
  );

  return response.data;
}

// Generate or retrieve evaluation
export async function generateInterviewEvaluation(sessionId) {
  const response = await apiClient.post(
    `/interviews/${sessionId}/evaluate/`
  );

  return response.data;
}

// Retrieve existing saved evaluation
export async function getSavedInterviewEvaluation(sessionId) {
  const response = await apiClient.get(
    `/interviews/${sessionId}/evaluate/`
  );

  return response.data;
}
