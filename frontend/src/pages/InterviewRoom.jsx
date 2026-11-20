import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  generateInterviewEvaluation,
  getInterviewMessages,
  getInterviewSession,
  getSavedInterviewEvaluation,
  submitInterviewAnswer,
} from "../api/interviewService";

function getErrorMessage(error) {
  const data = error.response?.data;
  if (!data) {
    return error.message || "Unable to connect to the server. Check that Django is running.";
  }
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
      return `${field}: ${message}`;
    })
    .join(" ");
}

function ScoreBar({ label, score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#586777]">{label}</span>
        <span className="text-xs font-semibold text-[#3E5870]">{safeScore}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F5]">
        <div
          className="h-full rounded-full bg-[#91B9DB] transition-all duration-500"
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

function EvaluationReport({ evaluation, onBack }) {
  const questionFeedback = evaluation.question_feedback || [];

  return (
    <div className="mx-auto max-w-[1050px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">INTERVIEW RESULTS</p>
          <h1 className="mt-2 text-[25px] font-semibold tracking-tight text-[#293747]">Your evaluation report</h1>
          <p className="mt-1 text-xs text-[#8793A0]">A detailed review of your interview performance.</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-md border border-[#E2E8EE] bg-white px-3 py-2.5 text-xs font-medium text-[#667789] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col items-center justify-center border border-[#E8ECF0] bg-white px-6 py-7 text-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-[9px] border-[#E7F0F7] bg-[#F8FBFD]">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-[#477FAE]">{evaluation.overall_score}</p>
              <p className="text-[10px] text-[#8995A2]">out of 100</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#EEF7F1] px-3 py-1.5 text-[10px] font-semibold text-[#4E8A69]">
            <Trophy size={13} /> Interview completed
          </div>
        </div>

        <div className="border border-[#E8ECF0] bg-white p-6">
          <div className="mb-5 flex items-center gap-2">
            <BarChartIcon />
            <h2 className="text-sm font-semibold text-[#39495A]">Performance breakdown</h2>
          </div>
          <div className="space-y-5">
            <ScoreBar label="Technical knowledge" score={evaluation.technical_knowledge_score} />
            <ScoreBar label="Answer quality" score={evaluation.answer_quality_score} />
            <ScoreBar label="Communication" score={evaluation.communication_score} />
          </div>
        </div>
      </section>

      <section className="border border-[#E8ECF0] bg-white p-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={17} className="text-[#78A2C8]" />
          <h2 className="text-sm font-semibold text-[#39495A]">Overall feedback</h2>
        </div>
        <p className="mt-3 text-xs leading-6 text-[#6F7E8D]">{evaluation.summary}</p>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="border border-[#E8ECF0] bg-white p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-[#39495A]">Strengths</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {(evaluation.strengths || []).map((item, index) => (
              <li key={index} className="flex gap-2 text-xs leading-5 text-[#738190]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
            {!evaluation.strengths?.length && <li className="text-xs text-[#98A3AE]">No strengths provided.</li>}
          </ul>
        </div>

        <div className="border border-[#E8ECF0] bg-white p-5">
          <div className="flex items-center gap-2">
            <Target size={17} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-[#39495A]">Areas to improve</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {(evaluation.improvement_areas || []).map((item, index) => (
              <li key={index} className="flex gap-2 text-xs leading-5 text-[#738190]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {item}
              </li>
            ))}
            {!evaluation.improvement_areas?.length && <li className="text-xs text-[#98A3AE]">No improvement areas provided.</li>}
          </ul>
        </div>

        <div className="border border-[#E8ECF0] bg-white p-5">
          <div className="flex items-center gap-2">
            <Lightbulb size={17} className="text-[#78A2C8]" />
            <h2 className="text-sm font-semibold text-[#39495A]">Recommendations</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {(evaluation.recommendations || []).map((item, index) => (
              <li key={index} className="flex gap-2 text-xs leading-5 text-[#738190]">
                <ArrowRight size={13} className="mt-1 shrink-0 text-[#78A2C8]" />
                {item}
              </li>
            ))}
            {!evaluation.recommendations?.length && <li className="text-xs text-[#98A3AE]">No recommendations provided.</li>}
          </ul>
        </div>
      </section>

      <section className="border border-[#E8ECF0] bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#39495A]">Question-by-question feedback</h2>
            <p className="mt-1 text-[11px] text-[#98A3AE]">Review what went well and compare your answer with the suggested version.</p>
          </div>
          <span className="text-[10px] text-[#8793A0]">{questionFeedback.length} evaluated</span>
        </div>

        <div className="space-y-3">
          {questionFeedback.map((item, index) => (
            <details key={item.question_id} className="group border border-[#E8ECF0] bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
                <div>
                  <p className="text-xs font-semibold text-[#465667]">Question {index + 1}</p>
                  <p className="mt-1 text-[11px] text-[#8995A2]">Question ID: {item.question_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#477FAE]">{item.score}/100</span>
                  <span className="text-[#8A98A6] transition group-open:rotate-180">⌄</span>
                </div>
              </summary>

              <div className="border-t border-[#EDF0F3] px-4 py-4">
                <p className="text-xs leading-6 text-[#6F7E8D]">{item.assessment}</p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-[11px] font-semibold text-[#4E8064]">What went well</h4>
                    <ul className="mt-2 space-y-2">
                      {(item.what_went_well || []).map((point, pointIndex) => (
                        <li key={pointIndex} className="flex gap-2 text-[11px] leading-5 text-[#788695]">
                          <CheckCircle2 size={12} className="mt-1 shrink-0 text-emerald-600" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-semibold text-[#9A7137]">What to improve</h4>
                    <ul className="mt-2 space-y-2">
                      {(item.what_to_improve || []).map((point, pointIndex) => (
                        <li key={pointIndex} className="flex gap-2 text-[11px] leading-5 text-[#788695]">
                          <CircleAlert size={12} className="mt-1 shrink-0 text-amber-600" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 rounded-md bg-[#F6F9FB] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen size={14} className="text-[#6F9BC5]" />
                    <h4 className="text-[11px] font-semibold text-[#4C6175]">Suggested improved answer</h4>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-6 text-[#667789]">{item.improved_answer}</p>
                </div>
              </div>
            </details>
          ))}
          {!questionFeedback.length && <p className="text-xs text-[#98A3AE]">No question feedback is available.</p>}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-md border border-[#DCE5ED] bg-white px-4 py-2.5 text-xs font-medium text-[#526B83] hover:bg-[#F3F7FA]"
        >
          Back to dashboard <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function BarChartIcon() {
  return <Award size={17} className="text-[#78A2C8]" />;
}

export default function InterviewRoom({ session, initialQuestion, onExit }) {
  const [messages, setMessages] = useState([]);
  const [currentSession, setCurrentSession] = useState(session);
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion || null);
  const [answerText, setAnswerText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [generatingEvaluation, setGeneratingEvaluation] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");
  const conversationEndRef = useRef(null);

  const completed = currentSession.status === "completed";

  const loadInterview = useCallback(async () => {
    setLoadingMessages(true);
    setError("");

    try {
      const [messageData, sessionData] = await Promise.all([
        getInterviewMessages(session.id),
        getInterviewSession(session.id),
      ]);

      setMessages(messageData);
      setCurrentSession(sessionData);

      // Find the latest AI question linked to a database question.
      const latestQuestionMessage = [...messageData]
        .reverse()
        .find((message) => message.speaker === "ai" && message.question != null);

      // A question is unanswered when no later candidate message references it.
      const candidateAnsweredQuestionIds = new Set(
        messageData
          .filter((message) => message.speaker === "user" && message.question != null)
          .map((message) => Number(message.question))
      );

      if (sessionData.status === "in_progress" && latestQuestionMessage) {
        const latestQuestionId = Number(latestQuestionMessage.question);
        if (!candidateAnsweredQuestionIds.has(latestQuestionId)) {
          setCurrentQuestion((previous) => {
            if (previous?.id === latestQuestionId) return previous;
            return {
              id: latestQuestionId,
              question_text: latestQuestionMessage.content,
              topic: "Current interview question",
              question_type: null,
              order: null,
            };
          });
        } else {
          setCurrentQuestion(null);
        }
      } else {
        setCurrentQuestion(null);
      }

      if (sessionData.status === "completed") {
        setEvaluationLoading(true);
        try {
          const savedEvaluation = await getSavedInterviewEvaluation(session.id);
          setEvaluation(savedEvaluation);
        } catch (evaluationError) {
          if (evaluationError.response?.status === 404) {
            setEvaluation(null);
          } else {
            throw evaluationError;
          }
        } finally {
          setEvaluationLoading(false);
        }
      } else {
        setEvaluation(null);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingMessages(false);
    }
  }, [session.id]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMessages]);

  async function handleSubmitAnswer(event) {
    event.preventDefault();
    const content = answerText.trim();

    if (!content || !currentQuestion || sendingAnswer) return;

    setError("");
    setSendingAnswer(true);

    try {
      const result = await submitInterviewAnswer(
        session.id,
        currentQuestion.id,
        content,
        "text"
      );

      setMessages((previous) => [
        ...previous,
        result.user_message,
        result.ai_response,
        ...(result.question_message ? [result.question_message] : []),
      ]);

      setAnswerText("");

      if (result.next_question) {
        setCurrentQuestion(result.next_question);
      } else {
        setCurrentQuestion(null);
      }

      if (result.session) {
        setCurrentSession(result.session);
      }

      if (result.action === "complete") {
        setCurrentSession((previous) => ({
          ...previous,
          ...(result.session || {}),
          status: "completed",
        }));
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      // Reload saved history in case the server saved the turn before
      // the browser lost the response.
      await loadInterview();
    } finally {
      setSendingAnswer(false);
    }
  }

  async function handleGenerateEvaluation() {
    setError("");
    setGeneratingEvaluation(true);

    try {
      const report = await generateInterviewEvaluation(session.id);
      setEvaluation(report);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setGeneratingEvaluation(false);
    }
  }

  if (evaluation) {
    return (
      <EvaluationReport
        evaluation={evaluation}
        onBack={onExit}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1050px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">LIVE INTERVIEW</p>
          <h1 className="mt-2 text-[25px] font-semibold tracking-tight text-[#293747]">
            {currentSession.domain?.name || "Interview"} interview
          </h1>
          <p className="mt-1 text-xs text-[#8793A0]">
            {currentSession.target_role} · {currentSession.difficulty} · {currentSession.interview_type}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadInterview}
            disabled={loadingMessages}
            className="inline-flex items-center gap-2 rounded-md border border-[#E2E8EE] bg-white px-3 py-2.5 text-xs font-medium text-[#667789] hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loadingMessages ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-md border border-[#E2E8EE] bg-white px-3 py-2.5 text-xs font-medium text-[#667789] hover:bg-[#F8FAFC]"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">
          <span>{error}</span>
          <button type="button" onClick={loadInterview} className="shrink-0 font-semibold underline">Try again</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_0.7fr]">
        <section className="border border-[#E8ECF0] bg-white">
          <div className="flex items-center justify-between border-b border-[#EDF0F3] px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquareText size={17} className="text-[#78A2C8]" />
              <h2 className="text-sm font-semibold text-[#39495A]">Interview conversation</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-medium ${completed ? "bg-[#EEF7F1] text-[#4E8A69]" : "bg-[#F1F6FA] text-[#6488A8]"}`}>
              {completed ? "Completed" : "In progress"}
            </span>
          </div>

          <div className="max-h-[490px] min-h-[280px] space-y-4 overflow-y-auto bg-[#FBFCFD] p-5">
            {loadingMessages ? (
              <div className="flex items-center justify-center gap-2 py-12 text-xs text-[#8391A0]">
                <LoaderCircle size={16} className="animate-spin" /> Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#929DA8]">Your interview conversation will appear here.</p>
            ) : (
              messages.map((message) => {
                const isCandidate = message.speaker === "user";
                return (
                  <div key={message.id} className={`flex gap-3 ${isCandidate ? "justify-end" : "justify-start"}`}>
                    {!isCandidate && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDF4F9] text-[#6A98BE]">
                        <Sparkles size={15} />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-lg border px-4 py-3 ${isCandidate ? "border-[#DCE8F1] bg-[#EFF5FA]" : "border-[#E8ECF0] bg-white"}`}>
                      <p className="mb-1 text-[10px] font-semibold text-[#82909D]">
                        {isCandidate ? "You" : "PrepIt AI interviewer"}
                      </p>
                      <p className="whitespace-pre-wrap text-xs leading-6 text-[#4D5B69]">{message.content}</p>
                    </div>
                    {isCandidate && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF2F8] text-[#6A98BE]">
                        <UserRound size={15} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={conversationEndRef} />
          </div>

          {!completed && currentQuestion && (
            <form onSubmit={handleSubmitAnswer} className="border-t border-[#EDF0F3] p-5">
              <label htmlFor="candidate-answer" className="text-xs font-medium text-[#536274]">Your answer</label>
              <textarea
                id="candidate-answer"
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                rows={5}
                placeholder="Type your answer here..."
                disabled={sendingAnswer || loadingMessages}
                className="mt-2 w-full resize-y rounded-md border border-[#DFE6EC] bg-white px-3.5 py-3 text-sm leading-6 text-[#344354] outline-none placeholder:text-[#A3ADB7] focus:border-[#85AED0] focus:ring-2 focus:ring-[#EAF2F8] disabled:bg-[#F8FAFC]"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] text-[#9AA4AF]">Answer clearly and include examples where possible.</p>
                <button
                  type="submit"
                  disabled={!answerText.trim() || sendingAnswer || loadingMessages}
                  className="inline-flex items-center gap-2 rounded-md bg-[#477FAE] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#376F9F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingAnswer ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}
                  {sendingAnswer ? "Submitting..." : "Submit answer"}
                </button>
              </div>
            </form>
          )}

          {!completed && !currentQuestion && !loadingMessages && (
            <div className="border-t border-[#EDF0F3] p-5">
              <p className="text-xs leading-5 text-[#7B8996]">
                We couldn't identify an unanswered question from this conversation. Refresh the conversation or return to your dashboard and reopen the session.
              </p>
              <button
                type="button"
                onClick={loadInterview}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#DCE5ED] px-3 py-2 text-xs text-[#526B83] hover:bg-[#F3F7FA]"
              >
                <RefreshCw size={13} /> Reload conversation
              </button>
            </div>
          )}

          {completed && (
            <div className="border-t border-[#EDF0F3] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={19} className="mt-0.5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-semibold text-[#354354]">Interview completed</h3>
                  <p className="mt-1 text-xs leading-5 text-[#8793A0]">
                    Your answers are saved. Generate your evaluation to review your scores and detailed feedback.
                  </p>
                </div>
              </div>

              {evaluationLoading ? (
                <p className="mt-4 flex items-center gap-2 text-xs text-[#8391A0]">
                  <LoaderCircle size={14} className="animate-spin" /> Checking for your saved evaluation...
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateEvaluation}
                  disabled={generatingEvaluation}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#477FAE] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#376F9F] disabled:opacity-50"
                >
                  {generatingEvaluation ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generatingEvaluation ? "Generating evaluation..." : "Generate AI evaluation"}
                </button>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="border border-[#E8ECF0] bg-white p-5">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#6F9BC5]">SESSION DETAILS</p>
            <h3 className="mt-2 text-sm font-semibold text-[#39495A]">{currentSession.domain?.name || "Interview"}</h3>
            <div className="mt-4 space-y-3 text-xs text-[#788695]">
              <div className="flex justify-between gap-3"><span>Target role</span><span className="text-right font-medium text-[#526274]">{currentSession.target_role}</span></div>
              <div className="flex justify-between gap-3"><span>Difficulty</span><span className="capitalize font-medium text-[#526274]">{currentSession.difficulty}</span></div>
              <div className="flex justify-between gap-3"><span>Interview type</span><span className="capitalize font-medium text-[#526274]">{currentSession.interview_type}</span></div>
              <div className="flex justify-between gap-3"><span>Main questions</span><span className="font-medium text-[#526274]">{currentSession.question_count}</span></div>
            </div>
          </div>

          {currentQuestion && !completed && (
            <div className="border border-[#E8ECF0] bg-white p-5">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-[#6F9BC5]">CURRENT QUESTION</p>
              <h3 className="mt-2 text-sm font-semibold text-[#39495A]">{currentQuestion.topic || "Interview question"}</h3>
              <p className="mt-2 text-xs leading-6 text-[#7F8C99]">
                {currentQuestion.order ? `Question ${currentQuestion.order}` : "Current question"}
                {currentQuestion.question_type ? ` · ${currentQuestion.question_type.replaceAll("_", " ")}` : ""}
              </p>
              <p className="mt-3 text-xs leading-6 text-[#526274]">{currentQuestion.question_text}</p>
            </div>
          )}

          <div className="border border-[#E8ECF0] bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#78A2C8]" />
              <h3 className="text-xs font-semibold text-[#39495A]">AI interviewer</h3>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#84919E]">
              The interviewer adapts the conversation based on your answer. It may ask a follow-up or move to the next main question.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
