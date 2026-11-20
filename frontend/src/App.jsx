import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  History as HistoryIcon,
  Lightbulb,
  LoaderCircle,
  Menu,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import { logoutUser } from "./api/authService";
import { getDashboardData } from "./api/dashboardService";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewHistory from "./pages/InterviewHistory";
import VoiceInterviewRoom from "./pages/VoiceInterviewRoom";
import Progress from "./pages/Progress";
import QuestionBank from "./pages/QuestionBank";
import LearningPaths from "./pages/LearningPaths";
import SettingsPage from "./pages/Settings";
import Account from "./pages/Account";

const navigationGroups = [
  {
    title: "WORKSPACE",
    items: [
      { label: "Overview", icon: Home },
      { label: "Interviews", icon: MessageSquare },
      { label: "History", icon: HistoryIcon },
      { label: "Progress", icon: BarChart3 },
    ],
  },
  {
    title: "LEARNING",
    items: [
      { label: "Question Bank", icon: FileText },
      { label: "Learning Paths", icon: BookOpen },
    ],
  },
];

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getSessionDomain(session) {
  return session?.domain?.name || "Interview";
}

function getSessionEvaluation(session, evaluations) {
  return evaluations.find(
    (evaluation) => evaluation.session?.id === session.id
  ) || null;
}

function App() {
  // AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(sessionStorage.getItem("accessToken"))
  );
  const [authMode, setAuthMode] = useState("login");
  const [registeredUsername, setRegisteredUsername] = useState("");
  const [authNotice, setAuthNotice] = useState("");

  // SIDEBAR AND PAGE STATE
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  // LIVE DASHBOARD DATA STATE
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeInterview, setActiveInterview] = useState(null);

  function navigate(page) {
    setActivePage(page);
    setMenuOpen(false);
  }

  function openMobileMenu() {
    setSidebarExpanded(true);
    setMenuOpen(true);
  }

  // Load profile, interviews and evaluations after login.
  useEffect(() => {
    if (!isAuthenticated) {
      setDashboardData(null);
      return undefined;
    }

    let isCurrent = true;

    async function loadDashboard() {
      setDashboardLoading(true);
      setDashboardError("");

      try {
        const data = await getDashboardData();
        if (isCurrent) {
          setDashboardData(data);
        }
      } catch (error) {
        const message =
          error.response?.data?.detail ||
          "We couldn't load your dashboard. Check that Django is running and try again.";

        if (isCurrent) {
          setDashboardError(message);
        }
      } finally {
        if (isCurrent) {
          setDashboardLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, refreshKey]);

  function handleLogout() {
    logoutUser();
    setIsAuthenticated(false);
    setDashboardData(null);
    setDashboardError("");
    setActivePage("Overview");
    setAuthMode("login");
  }

  // Authentication screens
  if (!isAuthenticated) {
    if (authMode === "register") {
      return (
        <Register
          onRegistered={(username) => {
            setRegisteredUsername(username);
            setAuthMode("login");
            setAuthNotice("Account created successfully! Please sign in.");
          }}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      );
    }

    return (
      <Login
        initialUsername={registeredUsername}
        notice={authNotice}
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setAuthNotice("");
        }}
        onSwitchToRegister={() => setAuthMode("register")}
      />
    );
  }

  const sessions = dashboardData?.sessions || [];
  const completedSessions = dashboardData?.completedSessions || [];
  const ongoingSessions = dashboardData?.ongoingSessions || [];
  const evaluations = dashboardData?.evaluations || [];
  const latestSession = dashboardData?.latestSession || null;
  const latestEvaluation = dashboardData?.latestEvaluation || null;

  const stats = [
    {
      title: "Interviews completed",
      value: completedSessions.length,
      note: "Completed interview sessions",
      icon: MessageSquare,
    },
    {
      title: "Average score",
      value: evaluations.length ? dashboardData.averageScore : "—",
      note: evaluations.length ? "Across evaluated interviews" : "No evaluations yet",
      icon: Award,
    },
    {
      title: "Questions answered",
      value: dashboardData?.totalQuestionsAnswered ?? 0,
      note: "Questions with saved evaluation feedback",
      icon: Target,
    },
  ];

  const performanceScores = latestEvaluation
    ? [
        {
          name: "Technical knowledge",
          score: latestEvaluation.technical_knowledge_score,
        },
        {
          name: "Answer quality",
          score: latestEvaluation.answer_quality_score,
        },
        {
          name: "Communication",
          score: latestEvaluation.communication_score,
        },
      ]
    : [];

  const recentSessions = sessions.slice(0, 4);
  const firstRecommendation = latestEvaluation?.recommendations?.[0];
  const firstImprovement = latestEvaluation?.improvement_areas?.[0];
  const profileTargetRole = dashboardData?.profile?.target_role;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#263445]">
      {/* MOBILE BACKDROP */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E9EDF1] bg-white transition-all duration-300 ease-in-out w-[235px] ${
          sidebarExpanded ? "lg:w-[235px]" : "lg:w-[76px]"
        } ${sidebarExpanded ? "px-5" : "px-2"} ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* BRAND AND SIDEBAR TOGGLE */}
        <div className="mb-12 pt-6">
          {sidebarExpanded ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#DFE9F1] bg-white">
                  <span className="text-[23px] font-semibold text-[#477FAE]">P</span>
                </div>
                <div>
                  <h1 className="text-[19px] font-semibold tracking-tight text-[#283747]">
                    PrepIt
                  </h1>
                  <p className="mt-0.5 text-[9px] tracking-[0.15em] text-[#9AA6B2]">
                    INTERVIEW PREPARATION
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSidebarExpanded(false)}
                className="hidden rounded-md p-1.5 text-[#8795A3] transition hover:bg-[#F1F5F8] hover:text-[#397DAF] lg:flex"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={19} />
              </button>

              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1.5 text-[#8795A3] hover:bg-[#F1F5F8] lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={19} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DFE9F1] bg-white"
                title="PrepIt"
              >
                <span className="text-[23px] font-semibold text-[#477FAE]">P</span>
              </div>

              <button
                onClick={() => setSidebarExpanded(true)}
                className="hidden rounded-md p-2 text-[#8795A3] transition hover:bg-[#F1F5F8] hover:text-[#397DAF] lg:flex"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight size={19} />
              </button>

              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-2 text-[#8795A3] hover:bg-[#F1F5F8] lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={19} />
              </button>
            </div>
          )}
        </div>

        {/* NAVIGATION GROUPS */}
        <nav className="flex-1 space-y-9">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {sidebarExpanded && (
                <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.14em] text-[#A0AAB5]">
                  {group.title}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.label;

                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.label)}
                      title={!sidebarExpanded ? item.label : undefined}
                      aria-label={item.label}
                      className={`flex w-full items-center rounded-md border-l-2 py-3 text-[13px] transition-all duration-200 ${
                        sidebarExpanded
                          ? "justify-start gap-3 px-3"
                          : "justify-center px-2"
                      } ${
                        isActive
                          ? "border-[#4789C0] bg-[#F3F7FB] font-semibold text-[#397DAF]"
                          : "border-transparent text-[#687787] hover:bg-[#F8FAFC] hover:text-[#397DAF]"
                      }`}
                    >
                      <Icon size={19} strokeWidth={1.7} />
                      {sidebarExpanded && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* SETTINGS AND PROFILE */}
        <div className="border-t border-[#EDF0F3] pt-5">
          <button
            onClick={() => navigate("Settings")}
            title={!sidebarExpanded ? "Settings" : undefined}
            className={`flex w-full items-center rounded-md border-l-2 py-3 text-[13px] text-[#687787] transition hover:bg-[#F8FAFC] ${
              sidebarExpanded
                ? "justify-start gap-3 px-3"
                : "justify-center px-2"
            } ${
              activePage === "Settings"
                ? "border-[#4789C0] bg-[#F3F7FB] text-[#397DAF]"
                : "border-transparent"
            }`}
          >
            <Settings size={19} strokeWidth={1.7} />
            {sidebarExpanded && "Settings"}
          </button>

          <button
            onClick={() => navigate("Account")}
            title={!sidebarExpanded ? "My Account" : undefined}
            className={`mt-1 flex w-full items-center rounded-md border-l-2 py-3 text-[13px] text-[#687787] transition hover:bg-[#F8FAFC] ${
              sidebarExpanded
                ? "justify-start gap-3 px-3"
                : "justify-center px-2"
            } ${
              activePage === "Account"
                ? "border-[#4789C0] bg-[#F3F7FB] text-[#397DAF]"
                : "border-transparent"
            }`}
          >
            <Users size={19} strokeWidth={1.7} />
            {sidebarExpanded && "My Account"}
          </button>

          <div
            className={`mt-5 flex items-center border-t border-[#EDF0F3] pt-5 ${
              sidebarExpanded ? "gap-3 px-1" : "justify-center"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF2F8] text-sm font-semibold text-[#477FAE]">
              {(dashboardData?.profile?.first_name || "C").charAt(0).toUpperCase()}
            </div>
            {sidebarExpanded && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#354454]">
                  {dashboardData?.profile?.first_name || "Candidate"}
                </p>
                <p className="text-[11px] text-[#9AA4AE]">My account</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          sidebarExpanded ? "lg:pl-[235px]" : "lg:pl-[76px]"
        }`}
      >
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 border-b border-[#E9EDF1] bg-white/95 backdrop-blur-sm">
          <div className="flex h-[70px] items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={openMobileMenu}
                className="rounded-md border border-[#E7EBEF] p-2 text-[#667687] hover:bg-[#F6F8FA] lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={19} />
              </button>

              <div>
                <p className="text-[11px] text-[#9AA5B0]">
                  Workspace / {activePage}
                </p>
                <h2 className="mt-0.5 text-[15px] font-semibold text-[#354354]">
                  {activePage}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-md border border-[#E7EBEF] bg-[#FAFBFC] px-3 py-2 sm:flex">
                <Search size={15} className="text-[#9AA5B0]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search..."
                  className="w-28 bg-transparent text-xs outline-none placeholder:text-[#A0A9B3] md:w-36"
                />
              </div>

              <button
                onClick={() => navigate("Interviews")}
                className="rounded-md border border-[#DCE5ED] bg-white px-3 py-2 text-xs font-medium text-[#526B83] transition hover:bg-[#F3F7FA]"
              >
                + New interview
              </button>

              <button
                onClick={handleLogout}
                className="hidden rounded-md border border-[#E2E8EE] bg-white px-3 py-2 text-xs font-medium text-[#687787] hover:bg-[#F8FAFC] sm:block"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
          {activePage === "Overview" ? (
            <div className="space-y-6">
              {/* PAGE TITLE */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] text-[#9BA5AF]">Workspace / Overview</p>
                  <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[#293747]">
                    Overview
                  </h1>
                  <p className="mt-1 text-xs text-[#8793A0]">
                    Here's an overview of your interview preparation.
                  </p>
                </div>

                <button
                  onClick={() => setRefreshKey((value) => value + 1)}
                  disabled={dashboardLoading}
                  className="inline-flex items-center gap-2 rounded-md border border-[#E2E8EE] bg-white px-3 py-2.5 text-xs font-medium text-[#667789] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  <RefreshCw size={14} className={dashboardLoading ? "animate-spin" : ""} />
                  Refresh data
                </button>
              </div>

              {/* LOADING */}
              {dashboardLoading && !dashboardData && (
                <div className="flex items-center gap-3 border border-[#E8ECF0] bg-white p-5 text-sm text-[#718092]">
                  <LoaderCircle size={18} className="animate-spin text-[#6F9BC5]" />
                  Loading your dashboard...
                </div>
              )}

              {/* API ERROR */}
              {dashboardError && (
                <div className="flex flex-wrap items-center justify-between gap-3 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <span>{dashboardError}</span>
                  <button
                    onClick={() => setRefreshKey((value) => value + 1)}
                    className="font-semibold underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* STATISTICS */}
              <section className="grid grid-cols-1 gap-0 border border-[#E8ECF0] bg-white sm:grid-cols-3">
                {stats.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className={`p-5 ${
                        index > 0
                          ? "border-t border-[#E8ECF0] sm:border-l sm:border-t-0"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-[#8995A2]">{item.title}</p>
                        <Icon size={17} className="text-[#83A9CE]" />
                      </div>
                      <h3 className="mt-4 text-[30px] font-semibold tracking-tight text-[#2B3949]">
                        {dashboardLoading && !dashboardData ? "—" : item.value}
                      </h3>
                      <p className="mt-1 text-[11px] text-[#9BA5B0]">{item.note}</p>
                    </div>
                  );
                })}
              </section>

              {/* DASHBOARD GRID */}
              <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.6fr_0.9fr]">
                {/* LEFT COLUMN */}
                <div className="space-y-5">
                  {/* PERFORMANCE */}
                  <div className="border border-[#E8ECF0] bg-white p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-semibold tracking-wider text-[#6F9BC5]">
                          ANALYTICS
                        </p>
                        <h2 className="mt-2 text-[17px] font-semibold text-[#344354]">
                          Performance breakdown
                        </h2>
                        <p className="mt-1 text-xs text-[#97A1AC]">
                          {latestSession
                            ? `${getSessionDomain(latestSession)} · ${latestSession.target_role}`
                            : "Your completed interview evaluations"}
                        </p>
                      </div>
                      <BarChart3 size={19} className="text-[#88A9C9]" />
                    </div>

                    {performanceScores.length > 0 ? (
                      <div className="mt-8 flex h-[230px] items-end justify-around border-b border-[#EDF0F3] px-2 sm:px-8">
                        {performanceScores.map((item) => (
                          <div
                            key={item.name}
                            className="flex h-full w-1/3 flex-col items-center justify-end gap-3"
                          >
                            <span className="text-xs font-semibold text-[#536E88]">
                              {item.score}
                            </span>
                            <div className="flex h-[170px] w-14 items-end rounded-t-sm bg-[#F0F3F6] sm:w-20">
                              <div
                                className="w-full rounded-t-sm bg-[#A2C9E8] transition-all hover:bg-[#79AFD8]"
                                style={{ height: `${item.score}%` }}
                              />
                            </div>
                            <span className="max-w-24 text-center text-[10px] leading-4 text-[#8793A0]">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-8 flex min-h-[190px] items-center justify-center border-b border-[#EDF0F3] text-center">
                        <div>
                          <BarChart3 size={28} className="mx-auto text-[#B7C6D3]" />
                          <p className="mt-3 text-sm font-medium text-[#687787]">
                            No evaluation data yet
                          </p>
                          <p className="mt-1 text-xs text-[#9AA5B0]">
                            Complete an interview and generate its AI report to see your scores.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex items-center gap-2 text-[11px] text-[#8793A0]">
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      {latestEvaluation
                        ? `${latestEvaluation.question_feedback.length} answered questions evaluated in your latest report.`
                        : "Your performance metrics will appear after an evaluation is generated."}
                    </div>
                  </div>

                  {/* RECENT INTERVIEWS */}
                  <div className="border border-[#E8ECF0] bg-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-[#354354]">Recent interviews</h2>
                        <p className="mt-1 text-[11px] text-[#99A3AE]">
                          Your latest interview sessions
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("Interviews")}
                        className="text-xs font-medium text-[#5086B5] hover:text-[#285C87]"
                      >
                        View all
                      </button>
                    </div>

                    {recentSessions.length > 0 ? (
                      <div className="mt-5 divide-y divide-[#EDF0F3] border-t border-[#EDF0F3]">
                        {recentSessions.map((session) => {
                          const evaluation = getSessionEvaluation(session, evaluations);
                          return (
                            <div
                              key={session.id}
                              className="flex flex-wrap items-center justify-between gap-4 py-4"
                            >
                              <div className="min-w-0">
                                <h3 className="text-[13px] font-medium text-[#445365]">
                                  {getSessionDomain(session)} Interview
                                </h3>
                                <p className="mt-1 text-[11px] text-[#98A3AE]">
                                  {session.target_role} · {session.difficulty} · {session.question_count} main questions
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#A1AAB4]">
                                  <CalendarDays size={12} />
                                  {formatDate(session.created_at)}
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-[10px] text-[#A0A9B3]">Score</p>
                                  <p className="mt-1 text-lg font-semibold text-[#477FAE]">
                                    {evaluation ? `${evaluation.overall_score}/100` : "—"}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-sm px-3 py-1.5 text-[10px] font-medium ${
                                    session.status === "completed"
                                      ? "bg-[#EEF7F1] text-[#4E8A69]"
                                      : "bg-[#FDF5E8] text-[#A8792D]"
                                  }`}
                                >
                                  {session.status.replaceAll("_", " ")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="border-t border-[#EDF0F3] py-8 text-center">
                        <MessageSquare size={25} className="mx-auto text-[#B7C6D3]" />
                        <p className="mt-3 text-sm font-medium text-[#687787]">
                          No interviews yet
                        </p>
                        <p className="mt-1 text-xs text-[#9AA5B0]">
                          Your interview history will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-5">
                  {/* GET STARTED */}
                  <div className="border border-[#E8ECF0] bg-white">
                    <div className="border-b border-[#EDF0F3] p-5">
                      <p className="text-[10px] font-semibold tracking-wider text-[#6F9BC5]">
                        GET STARTED
                      </p>
                      <h2 className="mt-2 text-[17px] font-semibold text-[#354354]">
                        Prepare for your next interview
                      </h2>
                      <p className="mt-1 text-[11px] text-[#9AA4AF]">
                        {profileTargetRole
                          ? `Keep building skills for ${profileTargetRole}.`
                          : "Continue improving your skills."}
                      </p>
                    </div>

                    {[
                      {
                        title: "Start a mock interview",
                        subtitle: "Create a new interview session",
                        icon: BrainCircuit,
                        action: "Interviews",
                        button: "Start",
                      },
                      {
                        title: "Review previous answers",
                        subtitle: "Learn from your AI feedback",
                        icon: FileText,
                        action: "Progress",
                        button: "Review",
                      },
                      {
                        title: "Explore learning paths",
                        subtitle: "Follow your recommendations",
                        icon: BookOpen,
                        action: "Learning Paths",
                        button: "Explore",
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          className="flex items-center gap-3 border-b border-[#F0F2F4] p-4 last:border-b-0 hover:bg-[#FBFCFD]"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F1F5F8] text-[#709BC3]">
                            <Icon size={17} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-[#455466]">{item.title}</p>
                            <p className="mt-1 text-[10px] text-[#A0AAB4]">{item.subtitle}</p>
                          </div>
                          <button
                            onClick={() => navigate(item.action)}
                            className="rounded border border-[#E3E8ED] px-2.5 py-1.5 text-[10px] text-[#6C8094] hover:border-[#A8C8E1] hover:text-[#397FAF]"
                          >
                            {item.button}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI INSIGHT */}
                  <div className="border border-[#E8ECF0] bg-white p-5">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={17} className="text-[#7DA5C9]" />
                      <h3 className="text-[13px] font-semibold text-[#39495A]">
                        AI interview insight
                      </h3>
                    </div>

                    {latestEvaluation ? (
                      <>
                        <p className="mt-3 text-[11px] leading-6 text-[#8391A0]">
                          {latestEvaluation.summary}
                        </p>
                        {firstImprovement && (
                          <div className="mt-4 bg-[#F5F8FB] p-3">
                            <p className="text-[10px] font-semibold text-[#637F98]">
                              AREA TO IMPROVE
                            </p>
                            <p className="mt-1 text-[10px] leading-5 text-[#71889D]">
                              {firstImprovement}
                            </p>
                          </div>
                        )}
                        {firstRecommendation && (
                          <div className="mt-3">
                            <p className="text-[10px] font-semibold text-[#637F98]">
                              RECOMMENDATION
                            </p>
                            <p className="mt-1 text-[10px] leading-5 text-[#71889D]">
                              {firstRecommendation}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-3 text-[11px] leading-6 text-[#8391A0]">
                        Complete an interview and generate its evaluation to receive personalized insights and preparation recommendations here.
                      </p>
                    )}

                    <button
                      onClick={() => navigate("Progress")}
                      className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-[#5086B5]"
                    >
                      View performance
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* ONGOING INTERVIEWS */}
                  <div className="border border-[#E8ECF0] bg-white p-5">
                    <div className="flex items-center gap-2">
                      <Clock3Icon />
                      <h3 className="text-[13px] font-semibold text-[#39495A]">
                        In progress
                      </h3>
                    </div>

                    {ongoingSessions.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {ongoingSessions.slice(0, 3).map((session) => (
                          <div key={session.id} className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-medium text-[#536274]">
                                {getSessionDomain(session)} Interview
                              </p>
                              <p className="mt-1 text-[10px] text-[#9CA6B0]">
                                {session.target_role}
                              </p>
                            </div>
                            <span className="text-[10px] capitalize text-[#A8792D]">
                              {session.status.replaceAll("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] leading-5 text-[#8B98A5]">
                        You don't have any interviews in progress.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>
           ) : activePage === "Question Bank" ? (
            <QuestionBank />
           ) : activePage === "Learning Paths" ? (
            <LearningPaths />
           ) : activePage === "Settings" ? (
            <SettingsPage />
           ) : activePage === "Account" ? (
            <Account />
           ) : activePage === "Progress" ? (
            <Progress />
           ) : activePage === "History" ? (
            <InterviewHistory
              sessions={sessions}
              evaluations={evaluations}
              loading={dashboardLoading}
              error={dashboardError}
              onRefresh={() => setRefreshKey((value) => value + 1)}
              onNewInterview={() => navigate("Interviews")}
              onOpenSession={(interview) => {
                setActiveInterview(interview);
                setActivePage("Interview Room");
              }}
            />
          ) : activePage === "Interviews" ? (
            <InterviewSetup
              onStarted={(startedInterview) => {
                setActiveInterview(startedInterview);
                setActivePage("Interview Room");
              }}
              onCancel={() => navigate("Overview")}
            />
          ) : activePage === "Interview Room" && activeInterview?.mode === "voice" ? (
            <VoiceInterviewRoom
              session={activeInterview.session}
              initialQuestion={activeInterview.firstQuestion}
              onExit={() => {
                setActiveInterview(null);
                setActivePage("Overview");
                setRefreshKey((value) => value + 1);
              }}
            />
          ) : activePage === "Interview Room" && activeInterview ? (
            <InterviewRoom
              session={activeInterview.session}
              initialQuestion={activeInterview.firstQuestion}
              onExit={() => {
                setActiveInterview(null);
                setActivePage("Overview");
                setRefreshKey((value) => value + 1);
              }}
            />
          ) : (
            <section className="flex min-h-[420px] items-center justify-center border border-[#E8ECF0] bg-white">
              <div className="max-w-sm p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[#E3EAF0] text-[#6D9CC4]">
                  <BrainCircuit size={23} />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-[#344456]">{activePage}</h2>
                <p className="mt-2 text-sm leading-6 text-[#8B98A5]">
                  This section is coming next. We're building your complete interview preparation experience.
                </p>
                <button
                  onClick={() => navigate("Overview")}
                  className="mt-5 border border-[#E1E8EE] px-4 py-2 text-xs font-medium text-[#66849F] hover:bg-[#F7F9FB]"
                >
                  Back to overview
                </button>
              </div>
            </section>
          )}

          <footer className="border-t border-[#E9EDF1] py-6 text-center text-[10px] text-[#A0A9B3]">
            © 2026 PrepIt · Prepare. Improve. Get hired.
          </footer>
        </main>
      </div>
    </div>
  );
}

function Clock3Icon() {
  return <Activity size={17} className="text-[#7DA5C9]" />;
}

export default App;
