import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  Mic,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import {
  createInterviewSession,
  getInterviewDomains,
  startInterviewSession,
} from "../api/interviewService";

function getErrorMessage(error) {
  const data = error.response?.data;

  if (!data) {
    return "Unable to connect to the server. Check that Django is running.";
  }

  if (data.detail) return data.detail;

  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages)
        ? messages.join(" ")
        : String(messages);
      return `${field}: ${message}`;
    })
    .join(" ");
}

const initialForm = {
  domain: "",
  target_role: "",
  difficulty: "intermediate",
  question_count: 5,
  interview_type: "technical",
};

const fieldClass =
  "mt-2 w-full appearance-none rounded-md border border-[#DFE6EC] bg-white px-3.5 py-3 text-sm text-[#344354] outline-none transition focus:border-[#85AED0] focus:ring-2 focus:ring-[#EAF2F8]";

export default function InterviewSetup({ onStarted, onCancel }) {
  const [domains, setDomains] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [interviewMode, setInterviewMode] = useState("text");

  useEffect(() => {
    let active = true;

    async function loadDomains() {
      setLoadingDomains(true);
      setError("");

      try {
        const data = await getInterviewDomains();
        if (!active) return;

        setDomains(data);

        if (data.length > 0) {
          setForm((previous) => ({
            ...previous,
            domain: String(data[0].id),
          }));
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      } finally {
        if (active) setLoadingDomains(false);
      }
    }

    loadDomains();

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.domain) {
      setError("Please select an interview domain.");
      return;
    }

    if (!form.target_role.trim()) {
      setError("Please enter your target job role.");
      return;
    }

    setStarting(true);

    try {
      // Create the interview record first.
      const createdSession = await createInterviewSession({
        domain: Number(form.domain),
        target_role: form.target_role.trim(),
        difficulty: form.difficulty,
        question_count: Number(form.question_count),
        interview_type: form.interview_type,
      });

      // Start the session. Django calls Gemini to generate question one.
      const startedInterview = await startInterviewSession(createdSession.id);

      if (!startedInterview.first_question) {
        throw new Error("The interview started, but no first question was returned.");
      }

      onStarted({
        session: startedInterview.session,
        firstQuestion: startedInterview.first_question,
        mode: interviewMode,
      });
    } catch (requestError) {
      setError(
        requestError.message && !requestError.response
          ? requestError.message
          : getErrorMessage(requestError)
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1050px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">
            INTERVIEW WORKSPACE
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-[#293747]">
            Set up your interview
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#8793A0]">
            Choose what you want to practise. PrepIt will create a personalized
            interview and generate questions with your AI interviewer.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#E2E8EE] bg-white px-4 py-2.5 text-xs font-medium text-[#667789] hover:bg-[#F8FAFC]"
          >
            Back to overview
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <form onSubmit={handleSubmit} className="border border-[#E8ECF0] bg-white p-5 sm:p-7">
          <div className="mb-6 border-b border-[#EDF0F3] pb-5">
            <h2 className="text-base font-semibold text-[#354354]">
              Interview preferences
            </h2>
            <p className="mt-1 text-xs text-[#98A3AE]">
              All fields are used to personalize your questions.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="domain" className="text-xs font-medium text-[#536274]">
                Interview domain
              </label>
              <div className="relative">
                <select
                  id="domain"
                  name="domain"
                  value={form.domain}
                  onChange={updateField}
                  disabled={loadingDomains || domains.length === 0}
                  required
                  className={fieldClass}
                >
                  {loadingDomains && <option value="">Loading domains...</option>}
                  {!loadingDomains && domains.length === 0 && (
                    <option value="">No active domains available</option>
                  )}
                  {domains.map((domain) => (
                    <option key={domain.id} value={String(domain.id)}>
                      {domain.name} · {domain.category}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8B98A5]" />
              </div>
              {form.domain && (
                <p className="mt-2 text-[11px] leading-5 text-[#98A3AE]">
                  {domains.find((item) => String(item.id) === form.domain)?.description ||
                    "Questions will be based on your selected domain."}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="target_role" className="text-xs font-medium text-[#536274]">
                Target job role
              </label>
              <div className="relative">
                <BriefcaseBusiness size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91A0AE]" />
                <input
                  id="target_role"
                  name="target_role"
                  value={form.target_role}
                  onChange={updateField}
                  placeholder="e.g. Backend Developer"
                  maxLength={100}
                  required
                  className={`${fieldClass} pl-9`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="difficulty" className="text-xs font-medium text-[#536274]">
                  Difficulty level
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={form.difficulty}
                  onChange={updateField}
                  className={fieldClass}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="question_count" className="text-xs font-medium text-[#536274]">
                  Number of main questions
                </label>
                <select
                  id="question_count"
                  name="question_count"
                  value={form.question_count}
                  onChange={updateField}
                  className={fieldClass}
                >
                  <option value={5}>5 questions</option>
                  <option value={8}>8 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="interview_type" className="text-xs font-medium text-[#536274]">
                Interview type
              </label>
              <select
                id="interview_type"
                name="interview_type"
                value={form.interview_type}
                onChange={updateField}
                className={fieldClass}
              >
                <option value="technical">Technical interview</option>
                <option value="hr">HR / Behavioral interview</option>
                <option value="project">Project-based interview</option>
                <option value="resume">Resume-based interview</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#536274]">
                How would you like to attend the interview?
              </label>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setInterviewMode("text")}
                  aria-pressed={interviewMode === "text"}
                  className={`flex items-start gap-3 border p-4 text-left transition ${
                    interviewMode === "text"
                      ? "border-[#82AED1] bg-[#F3F8FC] ring-1 ring-[#DCEAF4]"
                      : "border-[#E2E8EE] bg-white hover:bg-[#FAFBFC]"
                  }`}
                >
                  <MessageSquareText size={19} className="mt-0.5 shrink-0 text-[#6F9BC5]" />
                  <span>
                    <span className="block text-xs font-semibold text-[#39495A]">Text interview</span>
                    <span className="mt-1 block text-[11px] leading-5 text-[#8793A0]">Read questions and type your answers.</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInterviewMode("voice")}
                  aria-pressed={interviewMode === "voice"}
                  className={`flex items-start gap-3 border p-4 text-left transition ${
                    interviewMode === "voice"
                      ? "border-[#82AED1] bg-[#F3F8FC] ring-1 ring-[#DCEAF4]"
                      : "border-[#E2E8EE] bg-white hover:bg-[#FAFBFC]"
                  }`}
                >
                  <Mic size={19} className="mt-0.5 shrink-0 text-[#6F9BC5]" />
                  <span>
                    <span className="block text-xs font-semibold text-[#39495A]">Voice interview</span>
                    <span className="mt-1 block text-[11px] leading-5 text-[#8793A0]">Speak with the AI interviewer using your microphone.</span>
                  </span>
                </button>
              </div>
              {interviewMode === "voice" && (
                <p className="mt-2 text-[10px] leading-5 text-[#8793A0]">
                  Use Google Chrome and allow microphone access when the interview room opens.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF0F3] pt-5">
            <p className="text-[11px] text-[#98A3AE]">
              You can receive AI follow-up questions during the interview.
            </p>
            <button
              type="submit"
              disabled={starting || loadingDomains || domains.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#477FAE] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#376F9F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  Creating interview...
                </>
              ) : (
                <>
                  Start {interviewMode === "voice" ? "voice" : "text"} interview
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="border border-[#E8ECF0] bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-[#78A2C8]" />
              <h3 className="text-sm font-semibold text-[#39495A]">
                Your AI interview
              </h3>
            </div>
            <p className="mt-3 text-xs leading-6 text-[#84919E]">
              Gemini will generate the first question based on your selected
              domain, target role and difficulty. It can ask a relevant follow-up
              before moving to the next main question.
            </p>
          </div>

          <div className="border border-[#E8ECF0] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#39495A]">
              What happens next?
            </h3>
            <div className="mt-4 space-y-4">
              {[
                "Your interview session is created and saved.",
                "Gemini generates your first interview question.",
                "Answer each question and receive the next turn.",
                "Get an AI evaluation after completing the interview.",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F0F5F9] text-[10px] font-semibold text-[#668EAF]">
                    {index + 1}
                  </div>
                  <p className="text-xs leading-5 text-[#7F8C99]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 border border-[#E8ECF0] bg-[#F8FAFC] p-4 text-[11px] leading-5 text-[#7F8D9B]">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#78A98D]" />
            Your interview history and reports are saved to your account.
          </div>
        </aside>
      </div>
    </div>
  );
}
