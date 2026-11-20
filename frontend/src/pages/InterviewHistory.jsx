import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  getInterviewSession,
  startInterviewSession,
} from "../api/interviewService";

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error) {
  const data = error.response?.data;
  if (data?.detail) return data.detail;
  if (!data) return error.message || "Unable to connect to the server.";

  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages)
        ? messages.join(" ")
        : String(messages);
      return `${field}: ${message}`;
    })
    .join(" ");
}

function getEvaluation(session, evaluations) {
  return evaluations.find(
    (item) => Number(item.session?.id) === Number(session.id)
  ) || null;
}

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-[#EEF7F1] text-[#4E8A69]",
    in_progress: "bg-[#EEF5FB] text-[#527FA5]",
    created: "bg-[#FFF7E8] text-[#A8792D]",
    cancelled: "bg-[#F1F3F5] text-[#7E8994]",
  };

  const labels = {
    completed: "Completed",
    in_progress: "In progress",
    created: "Not started",
    cancelled: "Cancelled",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${styles[status] || styles.created}`}>
      {labels[status] || status?.replaceAll("_", " ") || "Unknown"}
    </span>
  );
}

export default function InterviewHistory({
  sessions = [],
  evaluations = [],
  loading = false,
  error = "",
  onRefresh,
  onNewInterview,
  onOpenSession,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openingId, setOpeningId] = useState(null);
  const [actionError, setActionError] = useState("");

  const sortedSessions = useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [sessions]);

  const counts = useMemo(() => ({
    all: sortedSessions.length,
    completed: sortedSessions.filter((item) => item.status === "completed").length,
    in_progress: sortedSessions.filter((item) => item.status === "in_progress").length,
    created: sortedSessions.filter((item) => item.status === "created").length,
  }), [sortedSessions]);

  const filteredSessions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sortedSessions.filter((session) => {
      const matchesFilter =
        activeFilter === "all" || session.status === activeFilter;

      const searchText = [
        session.domain?.name,
        session.domain?.category,
        session.target_role,
        session.interview_type,
        session.difficulty,
      ].join(" ").toLowerCase();

      return matchesFilter && (!normalizedSearch || searchText.includes(normalizedSearch));
    });
  }, [sortedSessions, activeFilter, search]);

  async function handleOpenSession(session) {
    setActionError("");
    setOpeningId(session.id);

    try {
      // Always read the latest server-side status before opening a session.
      const latestSession = await getInterviewSession(session.id);

      if (latestSession.status === "cancelled") {
        setActionError("This interview was cancelled and cannot be reopened.");
        return;
      }

      // A created session has not started yet. Start it and generate question one.
      if (latestSession.status === "created") {
        const started = await startInterviewSession(latestSession.id);

        if (!started.first_question) {
          throw new Error("The interview started, but the first question was not returned.");
        }

        onOpenSession?.({
          session: started.session,
          firstQuestion: started.first_question,
        });
        return;
      }

      // InterviewRoom loads conversation and saved evaluation using the session ID.
      onOpenSession?.({
        session: latestSession,
        firstQuestion: null,
      });
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setOpeningId(null);
    }
  }

  const filters = [
    { label: "All interviews", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "In progress", value: "in_progress" },
    { label: "Not started", value: "created" },
  ];

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">
            YOUR PREPARATION
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-[#293747]">
            Interview history
          </h1>
          <p className="mt-1 text-sm text-[#8793A0]">
            Review previous interviews, continue unfinished sessions and revisit your AI feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-[#E2E8EE] bg-white px-3 py-2.5 text-xs font-medium text-[#667789] hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onNewInterview}
            className="inline-flex items-center gap-2 rounded-md bg-[#477FAE] px-3.5 py-2.5 text-xs font-medium text-white hover:bg-[#376F9F]"
          >
            <Plus size={15} /> New interview
          </button>
        </div>
      </div>

      {/* SUMMARY COUNTS */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total interviews", value: counts.all, icon: MessageSquare },
          { label: "Completed", value: counts.completed, icon: CheckCircle2 },
          { label: "In progress", value: counts.in_progress, icon: Clock3 },
          { label: "Not started", value: counts.created, icon: FileText },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="border border-[#E8ECF0] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-[#8995A2]">{item.label}</p>
                <Icon size={16} className="text-[#83A9CE]" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-[#2B3949]">{item.value}</p>
            </div>
          );
        })}
      </section>

      {/* FILTERS AND SEARCH */}
      <section className="flex flex-col gap-3 border border-[#E8ECF0] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-md px-3 py-2 text-[11px] transition ${
                activeFilter === filter.value
                  ? "bg-[#EDF4FA] font-semibold text-[#397DAF]"
                  : "text-[#778594] hover:bg-[#F7F9FB]"
              }`}
            >
              {filter.label}
              <span className="ml-1.5 text-[10px] opacity-70">{counts[filter.value]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border border-[#E7EBEF] bg-[#FAFBFC] px-3 py-2">
          <Search size={14} className="text-[#9AA5B0]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search domain or role..."
            className="w-full bg-transparent text-xs outline-none placeholder:text-[#A0A9B3] sm:w-48"
          />
        </div>
      </section>

      {(error || actionError) && (
        <div role="alert" className="border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
          {actionError || error}
        </div>
      )}

      {/* SESSION LIST */}
      <section className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 border border-[#E8ECF0] bg-white py-16 text-xs text-[#8391A0]">
            <LoaderCircle size={16} className="animate-spin" /> Loading your interviews...
          </div>
        ) : filteredSessions.length > 0 ? (
          filteredSessions.map((session) => {
            const evaluation = getEvaluation(session, evaluations);
            const isOpening = openingId === session.id;
            const canOpen = session.status !== "cancelled";
            const actionLabel = session.status === "created"
              ? "Start interview"
              : session.status === "in_progress"
                ? "Continue interview"
                : evaluation
                  ? "View evaluation"
                  : "View interview";

            return (
              <article
                key={session.id}
                className="border border-[#E8ECF0] bg-white p-5 transition hover:border-[#D5E2EC]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#344354]">
                        {session.domain?.name || "Interview"} interview
                      </h2>
                      <StatusBadge status={session.status} />
                    </div>

                    <p className="mt-1.5 text-xs text-[#788695]">
                      {session.target_role || "Target role not set"} · {session.difficulty || "Difficulty unavailable"} · {(session.interview_type || "technical").replaceAll("_", " ")}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-[#9AA4AE]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={12} /> {formatDate(session.created_at)}
                      </span>
                      <span>{session.question_count} main questions</span>
                      <span>Session #{session.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-[#F0F2F4] pt-4 lg:border-t-0 lg:pt-0">
                    <div className="min-w-[76px]">
                      <p className="text-[10px] text-[#9AA4AE]">
                        {evaluation ? "Overall score" : "Evaluation"}
                      </p>
                      {evaluation ? (
                        <p className="mt-1 text-lg font-semibold text-[#477FAE]">
                          {evaluation.overall_score}/100
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[#8995A2]">
                          {session.status === "completed" ? "Not generated" : "—"}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenSession(session)}
                      disabled={!canOpen || isOpening}
                      className="inline-flex min-w-[154px] items-center justify-center gap-2 rounded-md border border-[#DCE5ED] bg-white px-3.5 py-2.5 text-[11px] font-medium text-[#526B83] transition hover:border-[#A8C8E1] hover:bg-[#F5F9FC] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isOpening ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <ArrowRight size={14} />
                      )}
                      {isOpening ? "Opening..." : actionLabel}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex flex-col items-center border border-[#E8ECF0] bg-white px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F6FA] text-[#789FBE]">
              <MessageSquare size={21} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#465667]">
              {sessions.length === 0 ? "No interviews yet" : "No matching interviews"}
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-[#929DA8]">
              {sessions.length === 0
                ? "Create your first mock interview. Your sessions and reports will appear here."
                : "Try another filter or search term to find an interview."}
            </p>
            {sessions.length === 0 && (
              <button
                type="button"
                onClick={onNewInterview}
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#477FAE] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#376F9F]"
              >
                <Plus size={14} /> Create interview
              </button>
            )}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 text-[10px] text-[#9AA4AE]">
        <Sparkles size={13} className="text-[#82A9CD]" />
        Your history is private to your PrepIt account.
      </div>
    </div>
  );
}
