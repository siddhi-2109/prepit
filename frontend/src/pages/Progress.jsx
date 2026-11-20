import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { getDashboardData } from "../api/dashboardService";

function Metric({ label, value, note, icon: Icon }) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#8995A2]">{label}</p>
        <Icon size={17} className="text-[#83A9CE]" />
      </div>

      <p className="mt-4 text-[30px] font-semibold text-[#2B3949]">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-[#9BA5B0]">{note}</p>
    </div>
  );
}

function ComparisonCard({ label, latest, previous }) {
  const current = Number(latest);
  const old = Number(previous);

  const hasCurrent = latest !== null && latest !== undefined && Number.isFinite(current);
  const hasPrevious = previous !== null && previous !== undefined && Number.isFinite(old);

  const difference = hasCurrent && hasPrevious ? current - old : null;

  return (
    <div className="border border-[#E8ECF0] bg-white p-4">
      <p className="text-xs text-[#8995A2]">{label}</p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-2xl font-semibold text-[#2B3949]">
          {hasCurrent ? `${current}/100` : "—"}
        </p>

        {difference !== null && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              difference > 0
                ? "text-emerald-600"
                : difference < 0
                ? "text-rose-600"
                : "text-[#8995A2]"
            }`}
          >
            {difference > 0 ? (
              <TrendingUp size={14} />
            ) : difference < 0 ? (
              <TrendingDown size={14} />
            ) : null}

            {difference > 0 ? "+" : ""}
            {difference} pts
          </span>
        )}
      </div>

      <p className="mt-1 text-[10px] text-[#A0A9B3]">
        {hasPrevious
          ? `Previous: ${old}/100`
          : "Complete another interview to compare"}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Progress() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboardData();
      setDashboard(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "We couldn't load your progress. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const evaluations = useMemo(() => {
    return [...(dashboard?.evaluations || [])].sort((a, b) => {
      const dateA = new Date(
        a.session?.completed_at || a.created_at || 0
      ).getTime();

      const dateB = new Date(
        b.session?.completed_at || b.created_at || 0
      ).getTime();

      return dateA - dateB;
    });
  }, [dashboard]);

  const latest = evaluations[evaluations.length - 1] || null;
  const previous = evaluations[evaluations.length - 2] || null;

  const scores = evaluations
    .map((item) => Number(item.overall_score))
    .filter(Number.isFinite);

  const bestScore = scores.length ? Math.max(...scores) : null;

  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;

  const feedback = Array.isArray(latest?.question_feedback)
    ? latest.question_feedback
    : [];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center border border-[#E8ECF0] bg-white">
        <div className="flex items-center gap-3 text-sm text-[#7E8B99]">
          <RefreshCw size={18} className="animate-spin" />
          Loading your progress...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-rose-100 bg-white p-8">
        <p className="text-sm text-rose-600">{error}</p>

        <button
          onClick={loadProgress}
          className="mt-4 flex items-center gap-2 border border-[#DCE5ED] px-4 py-2 text-xs text-[#526B83] hover:bg-[#F3F7FA]"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] text-[#9BA5AF]">
            Workspace / Progress
          </p>

          <h1 className="mt-1 text-[26px] font-semibold text-[#293747]">
            Your progress
          </h1>

          <p className="mt-1 text-xs text-[#8793A0]">
            Track your interview performance and see where you are improving.
          </p>
        </div>

        <button
          onClick={loadProgress}
          className="flex items-center gap-2 border border-[#E2E8EE] bg-white px-4 py-2.5 text-xs text-[#667789] hover:bg-[#F8FAFC]"
        >
          <RefreshCw size={14} />
          Refresh data
        </button>
      </div>

      {/* PERFORMANCE METRICS */}
      <section className="grid grid-cols-1 border border-[#E8ECF0] bg-white sm:grid-cols-3">
        <Metric
          label="Evaluated interviews"
          value={evaluations.length}
          note="Interviews with saved reports"
          icon={Award}
        />

        <div className="border-t border-[#E8ECF0] sm:border-l sm:border-t-0">
          <Metric
            label="Average score"
            value={averageScore === null ? "—" : `${averageScore}/100`}
            note="Across evaluated interviews"
            icon={BarChart3}
          />
        </div>

        <div className="border-t border-[#E8ECF0] sm:border-l sm:border-t-0">
          <Metric
            label="Personal best"
            value={bestScore === null ? "—" : `${bestScore}/100`}
            note="Your highest overall score"
            icon={Target}
          />
        </div>
      </section>

      {/* SCORE HISTORY AND COMPARISON */}
      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="border border-[#E8ECF0] bg-white p-6">
          <p className="text-[10px] font-semibold tracking-wider text-[#6F9BC5]">
            SCORE HISTORY
          </p>

          <h2 className="mt-2 text-[17px] font-semibold text-[#344354]">
            Overall interview performance
          </h2>

          <p className="mt-1 text-xs text-[#97A1AC]">
            Each bar represents one saved evaluation.
          </p>

          {evaluations.length === 0 ? (
            <div className="flex min-h-[230px] flex-col items-center justify-center text-center">
              <BarChart3 size={28} className="text-[#B4C7D8]" />

              <p className="mt-3 text-sm font-medium text-[#607184]">
                No evaluation history yet
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-[#9AA5B0]">
                Complete an interview and generate its AI evaluation to see
                your progress here.
              </p>
            </div>
          ) : (
            <div className="mt-7 flex min-h-[230px] items-end gap-3 overflow-x-auto border-b border-[#EDF0F3] px-2 pb-3 sm:gap-5 sm:px-5">
              {evaluations.map((item, index) => {
                const score = Math.max(
                  0,
                  Math.min(100, Number(item.overall_score) || 0)
                );

                return (
                  <div
                    key={item.id}
                    className="flex h-[220px] min-w-[65px] flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-semibold text-[#536E88]">
                      {score}
                    </span>

                    <div className="flex h-[165px] w-full max-w-[72px] items-end bg-[#F0F3F6]">
                      <div
                        className="w-full bg-[#A2C9E8] transition-all hover:bg-[#79AFD8]"
                        style={{ height: `${score}%` }}
                        title={`${score}/100`}
                      />
                    </div>

                    <span className="text-[10px] text-[#8793A0]">
                      Interview {index + 1}
                    </span>

                    <span className="text-[9px] text-[#A5AEB7]">
                      {formatDate(
                        item.session?.completed_at || item.created_at
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* PERFORMANCE COMPARISON */}
          <div className="border border-[#E8ECF0] bg-white p-5">
            <p className="text-[10px] font-semibold tracking-wider text-[#6F9BC5]">
              LATEST EVALUATION
            </p>

            <h2 className="mt-2 text-[17px] font-semibold text-[#344354]">
              Performance comparison
            </h2>

            {latest ? (
              <div className="mt-5 space-y-3">
                <ComparisonCard
                  label="Technical knowledge"
                  latest={latest.technical_knowledge_score}
                  previous={previous?.technical_knowledge_score}
                />

                <ComparisonCard
                  label="Answer quality"
                  latest={latest.answer_quality_score}
                  previous={previous?.answer_quality_score}
                />

                <ComparisonCard
                  label="Communication"
                  latest={latest.communication_score}
                  previous={previous?.communication_score}
                />
              </div>
            ) : (
              <p className="mt-4 text-xs text-[#9AA5B0]">
                Your category scores will appear after your first evaluation.
              </p>
            )}
          </div>

          {/* RECOMMENDATIONS */}
          <div className="border border-[#E8ECF0] bg-white p-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={17} className="text-[#7DA5C9]" />

              <h3 className="text-sm font-semibold text-[#39495A]">
                Focus for next time
              </h3>
            </div>

            {latest?.recommendations?.length ? (
              <ul className="mt-4 space-y-3">
                {latest.recommendations.slice(0, 3).map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-2 text-xs leading-5 text-[#788797]"
                  >
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-[#80A9CB]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-5 text-[#8D9AA7]">
                Recommendations will appear after an interview evaluation
                is generated.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* LATEST QUESTION FEEDBACK */}
      {latest && (
        <section className="border border-[#E8ECF0] bg-white p-6">
          <p className="text-[10px] font-semibold tracking-wider text-[#6F9BC5]">
            QUESTION ANALYSIS
          </p>

          <h2 className="mt-2 text-[17px] font-semibold text-[#344354]">
            Latest interview feedback
          </h2>

          <p className="mt-1 text-xs text-[#97A1AC]">
            {latest.session?.domain?.name || "Interview"} ·{" "}
            {formatDate(
              latest.session?.completed_at || latest.created_at
            )}
          </p>

          <p className="mt-4 text-xs text-[#7F8B98]">
            {feedback.length} questions evaluated
          </p>

          <div className="mt-4 divide-y divide-[#EDF0F3]">
            {feedback.map((item, index) => (
              <div key={item.question_id || index} className="py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#455466]">
                    Question {index + 1}
                  </p>

                  <span className="text-sm font-semibold text-[#477FAE]">
                    {item.score}/100
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#7D8A98]">
                  {item.assessment}
                </p>

                {item.what_to_improve?.length > 0 && (
                  <p className="mt-2 text-[11px] leading-5 text-[#8793A0]">
                    <span className="font-semibold text-[#68798A]">
                      To improve:{" "}
                    </span>
                    {item.what_to_improve.join("; ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 text-[11px] text-[#8793A0]">
        <CalendarDays size={14} />
        Progress is calculated from your saved interview evaluations.
      </div>
    </div>
  );
}