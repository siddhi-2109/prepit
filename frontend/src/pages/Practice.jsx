
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Lightbulb,
  LoaderCircle,
  Search,
  Target,
} from "lucide-react";

import apiClient from "../api/apiClient";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Weak areas", value: "weakness" },
  { label: "Recommendations", value: "recommendation" },
  { label: "Answer review", value: "answer" },
];

function getList(value) {
  return Array.isArray(value) ? value : [];
}

  function Practice({ onStartPractice = () => {} }) {
  const [practiceData, setPracticeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedAnswer, setExpandedAnswer] = useState(null);

  // Load saved interview evaluations from Django
  useEffect(() => {
    let cancelled = false;

    async function loadPracticeData() {
      try {
        setLoading(true);
        setError("");

        // BLOCK 1: Get the candidate's interviews
        const sessionsResponse = await apiClient.get("/interviews/");

        const sessions = Array.isArray(sessionsResponse.data)
          ? sessionsResponse.data
          : sessionsResponse.data.results || [];

        const completedSessions = sessions.filter(
          (session) => session.status === "completed"
        );

        // BLOCK 2: Retrieve each saved evaluation
        const results = await Promise.all(
          completedSessions.map(async (session) => {
            try {
              const [evaluationResponse, messagesResponse] =
                await Promise.all([
                  apiClient.get(
                    `/interviews/${session.id}/evaluate/`
                  ),
                  apiClient.get(
                    `/interviews/${session.id}/messages/`
                  ),
                ]);

              return {
                session,
                evaluation: evaluationResponse.data,
                messages: Array.isArray(messagesResponse.data)
                  ? messagesResponse.data
                  : [],
              };

            } catch (requestError) {
              // Some completed interviews may not have a report yet
              if (requestError.response?.status === 404) {
                return null;
              }

              throw requestError;
            }
          })
        );

        if (cancelled) return;

        setPracticeData(results.filter(Boolean));

      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.detail ||
            "Unable to load your practice recommendations. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPracticeData();

    return () => {
      cancelled = true;
    };
  }, []);

  // BLOCK 3: Prepare personalized practice cards
  const practiceItems = useMemo(() => {
    const items = [];

    practiceData.forEach(({ session, evaluation, messages }) => {
      const sessionName =
        session.domain?.name || "Interview";

      // Add AI-identified improvement areas
      getList(evaluation.improvement_areas).forEach(
        (area, index) => {
          items.push({
            id: `weak-${session.id}-${index}`,
            type: "weakness",
            title: area,
            description:
              "Identified as an area to improve in your interview evaluation.",
            sessionName,
          });
        }
      );

      // Add personalized AI recommendations
      getList(evaluation.recommendations).forEach(
        (recommendation, index) => {
          items.push({
            id: `recommendation-${session.id}-${index}`,
            type: "recommendation",
            title: recommendation,
            description:
              "A preparation recommendation generated from your interview performance.",
            sessionName,
          });
        }
      );

      // Match saved question IDs with their original AI questions
      const questionMap = {};

      messages.forEach((message) => {
        if (
          message.speaker === "ai" &&
          message.question !== null &&
          message.question !== undefined
        ) {
          questionMap[String(message.question)] = message.content;
        }
      });

      // Add question-wise feedback and improved answers
      getList(evaluation.question_feedback).forEach(
        (feedback, index) => {
          const questionText =
            questionMap[String(feedback.question_id)] ||
            `Interview question ${index + 1}`;

          items.push({
            id: `answer-${session.id}-${feedback.question_id}`,
            type: "answer",
            title: questionText,
            description: feedback.assessment,
            improvedAnswer: feedback.improved_answer,
            whatWentWell: getList(feedback.what_went_well),
            whatToImprove: getList(feedback.what_to_improve),
            score: feedback.score,
            sessionName,
          });
        }
      );
    });

    return items;
  }, [practiceData]);

  // BLOCK 4: Remove duplicate improvement topics
  const uniqueItems = useMemo(() => {
    const seen = new Set();

    return practiceItems.filter((item) => {
      if (item.type === "answer") return true;

      const key = `${item.type}-${item.title.toLowerCase().trim()}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }, [practiceItems]);

  // BLOCK 5: Apply search and selected filter
  const filteredItems = uniqueItems.filter((item) => {
    const matchesFilter =
      activeFilter === "all" ||
      item.type === activeFilter;

    const searchText = search.toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(searchText) ||
      item.description.toLowerCase().includes(searchText);

    return matchesFilter && matchesSearch;
  });

  const weakAreaCount = uniqueItems.filter(
    (item) => item.type === "weakness"
  ).length;

  const recommendationCount = uniqueItems.filter(
    (item) => item.type === "recommendation"
  ).length;

  const answerCount = uniqueItems.filter(
    (item) => item.type === "answer"
  ).length;

  function getCardIcon(type) {
    if (type === "weakness") return Target;
    if (type === "recommendation") return Lightbulb;
    return BookOpen;
  }

  function getCardLabel(type) {
    if (type === "weakness") return "Improvement area";
    if (type === "recommendation") return "AI recommendation";
    return "Answer review";
  }

  return (
    <div className="space-y-6">

      {/* PAGE HEADING */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-[#9BA5AF]">
            Workspace / Practice
          </p>

          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[#293747]">
            Practice
          </h1>

          <p className="mt-2 text-xs text-[#8793A0]">
            Focus on the areas that will improve your interview performance.
          </p>
        </div>

        <button
          onClick={onStartPractice}
          className="flex items-center gap-2 rounded-md border border-[#DCE5ED] bg-white px-4 py-2.5 text-xs font-medium text-[#526B83] transition hover:bg-[#F3F7FA]"
        >
          <BrainCircuit size={15} />
          Start mock interview
        </button>
      </section>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center border border-[#E8ECF0] bg-white">
          <div className="text-center">
            <LoaderCircle
              size={27}
              className="mx-auto animate-spin text-[#719DC4]"
            />
            <p className="mt-3 text-sm text-[#8793A0]">
              Preparing your personalized practice plan...
            </p>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-800">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs font-semibold text-amber-800 underline"
          >
            Reload page
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* PRACTICE STATISTICS */}
          <section className="grid grid-cols-1 gap-0 border border-[#E8ECF0] bg-white sm:grid-cols-3">

            {[
              {
                label: "Improvement areas",
                value: weakAreaCount,
                icon: Target,
              },
              {
                label: "AI recommendations",
                value: recommendationCount,
                icon: Lightbulb,
              },
              {
                label: "Answers to review",
                value: answerCount,
                icon: BookOpen,
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`p-5 ${
                    index > 0
                      ? "border-t border-[#E8ECF0] sm:border-l sm:border-t-0"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#8995A2]">
                      {item.label}
                    </p>

                    <Icon size={17} className="text-[#83A9CE]" />
                  </div>

                  <h2 className="mt-3 text-[28px] font-semibold text-[#2B3949]">
                    {item.value}
                  </h2>
                </div>
              );
            })}

          </section>

          {/* PRACTICE CONTENT */}
          <section className="border border-[#E8ECF0] bg-white">

            <div className="border-b border-[#EDF0F3] p-5">

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div>
                  <h2 className="text-[16px] font-semibold text-[#344354]">
                    Your personalized practice plan
                  </h2>

                  <p className="mt-1 text-[11px] text-[#97A1AC]">
                    Based on your saved AI interview evaluations.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-[#E7EBEF] bg-[#FAFBFC] px-3 py-2">
                  <Search size={14} className="text-[#9AA5B0]" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search practice topics..."
                    className="w-36 bg-transparent text-xs outline-none placeholder:text-[#A0A9B3]"
                  />
                </div>

              </div>

              {/* FILTERS */}
              <div className="mt-5 flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`rounded-md border px-3 py-2 text-[11px] font-medium transition ${
                      activeFilter === filter.value
                        ? "border-[#8BB1D2] bg-[#EFF5FA] text-[#397DAF]"
                        : "border-[#E7EBEF] bg-white text-[#7D8996] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

            </div>

            {/* EMPTY STATE */}
            {uniqueItems.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#F1F5F8] text-[#7FA5C7]">
                  <BookOpen size={23} />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-[#39495A]">
                  No practice recommendations yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#8B98A5]">
                  Complete an interview and generate its AI evaluation.
                  Your improvement areas and recommendations will appear here.
                </p>

                <button
                  onClick={onStartPractice}
                  className="mt-5 rounded-md bg-[#477FAE] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#376F9F]"
                >
                  Start an interview
                </button>
              </div>
            )}

            {/* FILTERED EMPTY STATE */}
            {uniqueItems.length > 0 && filteredItems.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-[#566576]">
                  No matching practice items found.
                </p>
                <p className="mt-2 text-xs text-[#9AA4AF]">
                  Try changing your search or filter.
                </p>
              </div>
            )}

            {/* PRACTICE CARDS */}
            <div className="divide-y divide-[#EDF0F3]">

              {filteredItems.map((item) => {
                const Icon = getCardIcon(item.type);
                const expanded = expandedAnswer === item.id;

                return (
                  <article
                    key={item.id}
                    className="p-5 transition hover:bg-[#FCFDFE]"
                  >

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F1F5F8] text-[#729CC2]">
                        <Icon size={19} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6F9BC5]">
                            {getCardLabel(item.type)}
                          </span>

                          {item.type === "answer" && (
                            <span className="rounded bg-[#F1F5F8] px-2 py-1 text-[10px] text-[#6F8091]">
                              Score: {item.score}/100
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 text-sm font-semibold leading-6 text-[#344354]">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs leading-6 text-[#82909E]">
                          {item.description}
                        </p>

                        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#A0AAB4]">
                          <Clock3 size={12} />
                          From {item.sessionName} interview
                        </p>

                        {/* ANSWER REVIEW DETAILS */}
                        {item.type === "answer" && (
                          <div className="mt-4">

                            <button
                              onClick={() =>
                                setExpandedAnswer(
                                  expanded ? null : item.id
                                )
                              }
                              className="flex items-center gap-2 text-xs font-semibold text-[#5086B5] hover:text-[#285C87]"
                            >
                              {expanded
                                ? "Hide answer review"
                                : "Review improved answer"
                              }

                              {expanded
                                ? <ChevronUp size={15} />
                                : <ChevronDown size={15} />
                              }
                            </button>

                            {expanded && (
                              <div className="mt-4 space-y-4">

                                {item.whatWentWell.length > 0 && (
                                  <div className="bg-[#F4F8F5] p-4">
                                    <p className="mb-2 text-xs font-semibold text-[#4C8060]">
                                      What went well
                                    </p>

                                    <ul className="space-y-2">
                                      {item.whatWentWell.map((point, index) => (
                                        <li
                                          key={index}
                                          className="flex gap-2 text-xs leading-5 text-[#647D6B]"
                                        >
                                          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                                          {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {item.whatToImprove.length > 0 && (
                                  <div className="bg-[#FAF8F2] p-4">
                                    <p className="mb-2 text-xs font-semibold text-[#927443]">
                                      What to improve
                                    </p>

                                    <ul className="space-y-2">
                                      {item.whatToImprove.map((point, index) => (
                                        <li
                                          key={index}
                                          className="text-xs leading-5 text-[#85765A]"
                                        >
                                          • {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="border border-[#E5EBF0] bg-white p-4">
                                  <p className="mb-3 text-xs font-semibold text-[#527EA5]">
                                    Professionally improved answer
                                  </p>

                                  <p className="whitespace-pre-line text-xs leading-6 text-[#647487]">
                                    {item.improvedAnswer}
                                  </p>
                                </div>

                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    </div>

                  </article>
                );
              })}

            </div>

          </section>

          {/* BOTTOM ACTION */}
          {uniqueItems.length > 0 && (
            <section className="flex flex-wrap items-center justify-between gap-4 border border-[#E8ECF0] bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-[#F0F5FA] p-2 text-[#729CC2]">
                  <BrainCircuit size={19} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#344354]">
                    Ready for another interview?
                  </h3>

                  <p className="mt-1 text-xs text-[#8995A2]">
                    Apply what you learned in your next AI mock interview.
                  </p>
                </div>
              </div>

              <button
                onClick={onStartPractice}
                className="flex items-center gap-2 rounded-md bg-[#477FAE] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#376F9F]"
              >
                Start mock interview
                <ArrowRight size={15} />
              </button>
            </section>
          )}

        </>
      )}

    </div>
  );
}export default Practice;