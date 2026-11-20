
import apiClient from "./apiClient";

// Fetch the logged-in user's dashboard information
export async function getDashboardData() {

  // 1. Fetch profile and interview sessions together
  const [profileResponse, sessionsResponse] = await Promise.all([
    apiClient.get("/profile/"),
    apiClient.get("/interviews/"),
  ]);

  const profile = profileResponse.data;

  // Support both normal arrays and paginated responses
  const sessions = Array.isArray(sessionsResponse.data)
    ? sessionsResponse.data
    : sessionsResponse.data.results || [];

  // 2. Separate completed and ongoing interviews
  const completedSessions = sessions
    .filter((session) => session.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

  const ongoingSessions = sessions.filter(
    (session) =>
      session.status === "in_progress" ||
      session.status === "created"
  );

  // 3. Retrieve evaluations for completed interviews
  const evaluationResults = await Promise.all(
    completedSessions.map(async (session) => {

      try {

        const response = await apiClient.get(
          `/interviews/${session.id}/evaluate/`
        );

        return {
          ...response.data,
          session,
        };

      } catch (error) {

        // A completed interview may not have an evaluation yet
        if (error.response?.status === 404) {
          return null;
        }

        throw error;
      }
    })
  );

  // 4. Remove sessions without generated evaluations
  const evaluations = evaluationResults.filter(Boolean);

  // 5. Find the latest interview and evaluation
  const latestSession = completedSessions[0] || null;

  const latestEvaluation = latestSession
    ? evaluations.find(
        (evaluation) => evaluation.session.id === latestSession.id
      ) || null
    : null;

  // 6. Calculate average score from saved reports
  const averageScore = evaluations.length
    ? Math.round(
        evaluations.reduce(
          (total, item) => total + item.overall_score,
          0
        ) / evaluations.length
      )
    : 0;

  // 7. Calculate total answered questions
  const totalQuestionsAnswered = evaluations.reduce(
    (total, item) =>
      total + item.question_feedback.length,
    0
  );

  // 8. Return everything to React
  return {
    profile,
    sessions,
    completedSessions,
    ongoingSessions,
    evaluations,
    latestSession,
    latestEvaluation,
    averageScore,
    totalQuestionsAnswered,
  };
}
