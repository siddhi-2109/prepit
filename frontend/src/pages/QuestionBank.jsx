import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  FilterX,
  Layers3,
  LoaderCircle,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

import { getQuestionBank, updateQuestionProgress } from "../api/questionBankService";

function formatDifficulty(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  async function loadQuestions() {
    setLoading(true);
    setError("");

    try {
      const data = await getQuestionBank();
      setQuestions(data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to load the Question Bank. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const domains = useMemo(
    () => [...new Set(questions.map((item) => item.domain))].sort(),
    [questions]
  );

  const savedIds = useMemo(
    () => questions.filter((item) => item.is_bookmarked).map((item) => item.id),
    [questions]
  );

  const practicedIds = useMemo(
    () => questions.filter((item) => item.is_practiced).map((item) => item.id),
    [questions]
  );

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return questions.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [item.question, item.topic, item.domain, item.answer]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesDomain = domain === "all" || item.domain === domain;
      const matchesDifficulty = difficulty === "all" || item.difficulty === difficulty;
      const matchesTab = activeTab === "all" || item.is_bookmarked;

      return matchesSearch && matchesDomain && matchesDifficulty && matchesTab;
    });
  }, [questions, search, domain, difficulty, activeTab]);

  async function updateProgress(id, changes) {
    setSavingIds((previous) => [...previous, id]);
    setError("");

    try {
      const result = await updateQuestionProgress(id, changes);
      setQuestions((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                is_bookmarked: result.is_bookmarked,
                is_practiced: result.is_practiced,
                practice_count: result.practice_count,
              }
            : item
        )
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Your progress could not be saved. Please try again."
      );
    } finally {
      setSavingIds((previous) => previous.filter((savedId) => savedId !== id));
    }
  }

  function toggleSaved(item) {
    updateProgress(item.id, { is_bookmarked: !item.is_bookmarked });
  }

  function togglePracticed(item) {
    updateProgress(item.id, { is_practiced: !item.is_practiced });
  }

  function clearFilters() {
    setSearch("");
    setDomain("all");
    setDifficulty("all");
    setActiveTab("all");
    setExpandedId(null);
  }

  const completionPercent = questions.length
    ? Math.round((practicedIds.length / questions.length) * 100)
    : 0;
  const beginnerCount = questions.filter((item) => item.difficulty === "beginner").length;
  const intermediateCount = questions.filter((item) => item.difficulty === "intermediate").length;
  const advancedCount = questions.filter((item) => item.difficulty === "advanced").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">
            PREPARATION LIBRARY
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-[#293747]">
            Question Bank
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#8793A0]">
            Strengthen your fundamentals with focused questions across programming,
            backend development, databases and problem solving.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 border border-[#E3EAF0] bg-white px-3 py-2 text-[11px] text-[#718397]">
          <Sparkles size={14} className="text-[#78A2C8]" />
          Build confidence one question at a time
        </div>
      </div>

      {error && questions.length > 0 && (
        <div role="alert" className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-0 border border-[#E8ECF0] bg-white sm:grid-cols-3">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#8995A2]">Available questions</p>
            <BookOpen size={17} className="text-[#83A9CE]" />
          </div>
          <p className="mt-3 text-[28px] font-semibold tracking-tight text-[#2B3949]">{questions.length}</p>
          <p className="mt-1 text-[10px] text-[#9BA5B0]">Across {domains.length} learning areas</p>
        </div>
        <div className="border-t border-[#E8ECF0] p-5 sm:border-l sm:border-t-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#8995A2]">Saved questions</p>
            <Bookmark size={17} className="text-[#83A9CE]" />
          </div>
          <p className="mt-3 text-[28px] font-semibold tracking-tight text-[#2B3949]">{savedIds.length}</p>
          <p className="mt-1 text-[10px] text-[#9BA5B0]">Your personal revision list</p>
        </div>
        <div className="border-t border-[#E8ECF0] p-5 sm:border-l sm:border-t-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#8995A2]">Marked as practised</p>
            <CheckCircle2 size={17} className="text-[#83A9CE]" />
          </div>
          <p className="mt-3 text-[28px] font-semibold tracking-tight text-[#2B3949]">{practicedIds.length}</p>
          <p className="mt-1 text-[10px] text-[#9BA5B0]">Questions you have reviewed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 space-y-4">
          <div className="border border-[#E8ECF0] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers3 size={17} className="text-[#78A2C8]" />
                <h2 className="text-sm font-semibold text-[#39495A]">Explore questions</h2>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#7F91A2] transition hover:text-[#477FAE]"
              >
                <FilterX size={13} /> Clear filters
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_210px_170px]">
              <label className="relative block">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA7B4]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search questions, topics or keywords..."
                  className="w-full border border-[#E2E8EE] bg-[#FCFDFE] py-2.5 pl-9 pr-3 text-xs text-[#455466] outline-none transition placeholder:text-[#A6B0B9] focus:border-[#91B7D6]"
                />
              </label>
              <label className="relative block">
                <select
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  className="w-full appearance-none border border-[#E2E8EE] bg-white px-3 py-2.5 pr-9 text-xs text-[#596A7B] outline-none focus:border-[#91B7D6]"
                >
                  <option value="all">All domains</option>
                  {domains.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA7B4]" />
              </label>
              <label className="relative block">
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="w-full appearance-none border border-[#E2E8EE] bg-white px-3 py-2.5 pr-9 text-xs text-[#596A7B] outline-none focus:border-[#91B7D6]"
                >
                  <option value="all">All levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA7B4]" />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-[#EDF0F3] pb-4">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`border-b-2 px-1 pb-2 text-xs font-medium transition ${activeTab === "all" ? "border-[#6F9FC8] text-[#3D6F98]" : "border-transparent text-[#8996A3] hover:text-[#526B83]"}`}
              >
                All questions <span className="ml-1 text-[10px] text-[#A1ACB7]">{questions.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={`ml-3 border-b-2 px-1 pb-2 text-xs font-medium transition ${activeTab === "saved" ? "border-[#6F9FC8] text-[#3D6F98]" : "border-transparent text-[#8996A3] hover:text-[#526B83]"}`}
              >
                Saved <span className="ml-1 text-[10px] text-[#A1ACB7]">{savedIds.length}</span>
              </button>
              <span className="ml-auto text-[10px] text-[#A0AAB4]">
                Showing {filteredQuestions.length} of {questions.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center gap-3 border border-[#E8ECF0] bg-white text-sm text-[#718092]">
              <LoaderCircle size={18} className="animate-spin text-[#6F9BC5]" />
              Loading your questions...
            </div>
          ) : error && questions.length === 0 ? (
            <div className="border border-amber-200 bg-white p-6 text-center">
              <p className="text-sm text-[#8B6B35]">{error}</p>
              <button type="button" onClick={loadQuestions} className="mt-3 text-xs font-semibold text-[#5687B2]">Try again</button>
            </div>
          ) : filteredQuestions.length > 0 ? (
            <div className="space-y-3">
              {filteredQuestions.map((item, index) => {
                const isExpanded = expandedId === item.id;
                const isSaved = item.is_bookmarked;
                const isPracticed = item.is_practiced;
                const isSaving = savingIds.includes(item.id);

                return (
                  <article key={item.id} className="border border-[#E8ECF0] bg-white transition hover:border-[#D8E4ED]">
                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-[#F1F6FA] px-2 py-1 text-[10px] font-medium text-[#6385A3]">{item.domain}</span>
                          <span className="text-[10px] text-[#99A5B0]">{item.topic}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-medium ${item.difficulty === "beginner" ? "text-[#648B75]" : item.difficulty === "advanced" ? "text-[#A17A61]" : "text-[#6D88A2]"}`}>
                            {formatDifficulty(item.difficulty)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#9AA5AF]">
                            <Clock3 size={12} /> {item.minutes} min
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSaved(item)}
                            disabled={isSaving}
                            aria-label={isSaved ? "Remove bookmark" : "Bookmark question"}
                            title={isSaved ? "Remove bookmark" : "Save question"}
                            className={`rounded p-1.5 transition ${isSaved ? "bg-[#F0F6FB] text-[#477FAE]" : "text-[#A0ABB5] hover:bg-[#F5F8FA] hover:text-[#477FAE]"}`}
                          >
                            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[#F5F7F9] text-[10px] font-semibold text-[#8A9AA9]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-[14px] font-semibold leading-6 text-[#364657]">{item.question}</h3>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pl-9">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          aria-expanded={isExpanded}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5687B2] transition hover:text-[#315F87]"
                        >
                          {isExpanded ? "Hide sample answer" : "View sample answer"}
                          <ChevronRight size={14} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePracticed(item)}
                          disabled={isSaving}
                          className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] font-medium transition ${isPracticed ? "border-[#DCE9E1] bg-[#F5FAF6] text-[#5D8B6D]" : "border-[#E4E9EE] text-[#7F8F9D] hover:border-[#BFD3E3] hover:text-[#477FAE]"}`}
                        >
                          {isPracticed ? <CheckCircle2 size={13} /> : <Check size={13} />}
                          {isPracticed ? "Practised" : "Mark as practised"}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#EDF0F3] bg-[#FBFCFD] px-5 py-5 sm:pl-[68px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <Code2 size={15} className="text-[#79A2C7]" />
                            <h4 className="text-xs font-semibold text-[#465A6D]">Sample answer</h4>
                          </div>
                          <p className="mt-2 text-xs leading-6 text-[#6E7E8D]">{item.answer}</p>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-[11px] font-semibold text-[#536A7F]">Key points to cover</h4>
                          <ul className="mt-2 space-y-2">
                            {(item.keyPoints || []).map((point) => (
                              <li key={point} className="flex items-start gap-2 text-[11px] leading-5 text-[#7B8996]">
                                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#7BA48B]" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="mt-4 border-l-2 border-[#B8D0E3] pl-3 text-[10px] leading-5 text-[#8C9AA7]">
                          Use this as a reference, not a script. Try explaining the idea in your own words.
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center border border-dashed border-[#DDE5EB] bg-white px-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center bg-[#F2F6F9] text-[#7C9FBD]">
                <Search size={19} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#46596B]">No questions found</h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[#96A1AC]">Try another keyword or change the selected filters.</p>
              <button type="button" onClick={clearFilters} className="mt-4 text-xs font-semibold text-[#5687B2] hover:text-[#315F87]">Clear filters</button>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="border border-[#E8ECF0] bg-white p-5">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#78A2C8]" />
              <h3 className="text-xs font-semibold text-[#39495A]">Your practice</h3>
            </div>
            <p className="mt-3 text-[26px] font-semibold tracking-tight text-[#35485A]">{completionPercent}%</p>
            <p className="mt-1 text-[10px] leading-5 text-[#99A4AF]">of this question set marked as practised</p>
            <div className="mt-4 h-1.5 overflow-hidden bg-[#EDF1F4]">
              <div className="h-full bg-[#8FB5D4] transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-[#9AA5AF]">{practicedIds.length} of {questions.length} questions reviewed</p>
          </div>

          <div className="border border-[#E8ECF0] bg-white p-5">
            <div className="flex items-center gap-2">
              <Layers3 size={16} className="text-[#78A2C8]" />
              <h3 className="text-xs font-semibold text-[#39495A]">Question levels</h3>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Beginner", count: beginnerCount, color: "bg-[#8DB69A]" },
                { label: "Intermediate", count: intermediateCount, color: "bg-[#8FB5D4]" },
                { label: "Advanced", count: advancedCount, color: "bg-[#C6A58C]" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setDifficulty(item.label.toLowerCase())}
                  className="w-full text-left"
                >
                  <div className="mb-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-[#738394]">{item.label}</span>
                    <span className="text-[#9AA5AF]">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-[#F0F3F5]">
                    <div className={`h-full ${item.color}`} style={{ width: `${(item.count / questions.length) * 100}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[#E8ECF0] bg-[#F8FAFC] p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#78A2C8]" />
              <h3 className="text-xs font-semibold text-[#536A7F]">A useful practice habit</h3>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#8291A0]">
              Read a question, answer it aloud without looking at the sample, then open the answer and check what you missed.
            </p>
          </div>
        </aside>
      </div>

      <p className="text-[10px] leading-5 text-[#A0AAB4]">
        Questions, bookmarks and practice progress are saved to your PrepIt account.
      </p>
    </div>
  );
}
