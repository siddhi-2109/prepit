import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Clock3,
  GraduationCap, LoaderCircle, RefreshCw, Target,
} from "lucide-react";
import {
  enrollLearningPath,
  getLearningPaths,
  updateLearningModuleProgress,
} from "../api/learningPathService";

const levelLabel = (value = "") => value.charAt(0).toUpperCase() + value.slice(1);

export default function LearningPaths() {
  const [paths, setPaths] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadPaths() {
    setLoading(true);
    setError("");
    try {
      const data = await getLearningPaths();
      setPaths(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load learning paths. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPaths(); }, []);

  const selectedPath = paths.find((path) => path.slug === selectedSlug) || null;
  const visiblePaths = useMemo(
    () => filter === "all" ? paths : paths.filter((path) => path.level === filter),
    [paths, filter]
  );
  const enrolledCount = paths.filter((path) => path.is_enrolled).length;
  const completedCount = paths.filter((path) => path.is_completed).length;

  async function handleEnroll(path) {
    setBusy(path.slug);
    setError("");
    try {
      await enrollLearningPath(path.slug);
      await loadPaths();
      setSelectedSlug(path.slug);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to start this learning path.");
    } finally {
      setBusy("");
    }
  }

  async function handleModuleToggle(module) {
    setBusy(`module-${module.id}`);
    setError("");
    try {
      await updateLearningModuleProgress(module.id, !module.is_completed);
      await loadPaths();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save module progress.");
    } finally {
      setBusy("");
    }
  }

  if (selectedPath) {
    const modules = selectedPath.modules || [];
    return (
      <div className="mx-auto max-w-[1200px] space-y-6">
        <button onClick={() => setSelectedSlug(null)} className="inline-flex items-center gap-2 text-xs font-medium text-[#6687A4] hover:text-[#477FAE]">
          <ArrowLeft size={15} /> All learning paths
        </button>
        <div className="border border-[#E8ECF0] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">LEARNING ROADMAP</p>
              <h1 className="mt-2 text-2xl font-semibold text-[#293747]">{selectedPath.title}</h1>
              <p className="mt-2 text-sm leading-6 text-[#8793A0]">{selectedPath.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[#7D8D9B]">
                <span>{selectedPath.target_role}</span><span>·</span><span>{levelLabel(selectedPath.level)}</span><span>·</span><span>{selectedPath.estimated_hours} estimated hours</span>
              </div>
            </div>
            {!selectedPath.is_enrolled && (
              <button onClick={() => handleEnroll(selectedPath)} disabled={!!busy} className="bg-[#477FAE] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#376F9F] disabled:opacity-50">
                {busy === selectedPath.slug ? "Starting..." : "Start this path"}
              </button>
            )}
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-[11px] text-[#718397]"><span>{selectedPath.completed_modules || 0} of {selectedPath.module_count || modules.length} modules completed</span><span>{selectedPath.progress_percent || 0}%</span></div>
            <div className="mt-2 h-2 overflow-hidden bg-[#EEF2F5]"><div className="h-full bg-[#83B3D8] transition-all" style={{ width: `${selectedPath.progress_percent || 0}%` }} /></div>
          </div>
        </div>
        <div className="space-y-3">
          {modules.map((module) => (
            <article key={module.id} className="border border-[#E8ECF0] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center ${module.is_completed ? "bg-[#EEF7F1] text-[#4E8A69]" : "bg-[#F1F6FA] text-[#6D98BC]"}`}>
                    {module.is_completed ? <CheckCircle2 size={17} /> : <span className="text-xs font-semibold">{module.order}</span>}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#39495A]">{module.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#8793A0]">{module.description}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#9AA5AF]"><Clock3 size={12}/>{module.estimated_minutes} minutes</p>
                  </div>
                </div>
                <button onClick={() => handleModuleToggle(module)} disabled={!selectedPath.is_enrolled || !!busy} className={`border px-3 py-2 text-[11px] font-medium disabled:opacity-50 ${module.is_completed ? "border-[#DCE9E1] bg-[#F5FAF6] text-[#5D8B6D]" : "border-[#E2E8EE] text-[#718397] hover:border-[#BFD3E3]"}`}>
                  {busy === `module-${module.id}` ? "Saving..." : module.is_completed ? "Mark incomplete" : "Mark complete"}
                </button>
              </div>
              {module.content && <p className="mt-4 border-t border-[#F0F2F4] pt-4 text-xs leading-6 text-[#667789]">{module.content}</p>}
              {module.practice_tasks?.length > 0 && <div className="mt-3"><p className="text-[10px] font-semibold tracking-wide text-[#6F9BC5]">PRACTICE TASKS</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-[#7C8996]">{module.practice_tasks.map((task, index) => <li key={`${module.id}-${index}`}>{task}</li>)}</ul></div>}
              {module.resource_url && <a href={module.resource_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#5687B2] hover:underline">{module.resource_label || "Learning resource"}<ChevronRight size={13}/></a>}
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">STRUCTURED PREPARATION</p><h1 className="mt-2 text-[26px] font-semibold tracking-tight text-[#293747]">Learning Paths</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-[#8793A0]">Follow a guided roadmap, complete practical modules and track your preparation progress.</p></div>
        <button onClick={loadPaths} disabled={loading} className="inline-flex items-center gap-2 border border-[#E2E8EE] bg-white px-3 py-2 text-xs text-[#667789] disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh</button>
      </div>
      {error && <div role="alert" className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{error}</div>}
      <div className="grid grid-cols-1 gap-0 border border-[#E8ECF0] bg-white sm:grid-cols-3">
        <div className="p-5"><p className="text-[11px] text-[#8995A2]">Available paths</p><p className="mt-2 text-3xl font-semibold text-[#2B3949]">{paths.length}</p></div>
        <div className="border-t border-[#E8ECF0] p-5 sm:border-l sm:border-t-0"><p className="text-[11px] text-[#8995A2]">Started by you</p><p className="mt-2 text-3xl font-semibold text-[#2B3949]">{enrolledCount}</p></div>
        <div className="border-t border-[#E8ECF0] p-5 sm:border-l sm:border-t-0"><p className="text-[11px] text-[#8995A2]">Completed paths</p><p className="mt-2 text-3xl font-semibold text-[#2B3949]">{completedCount}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {["all", "beginner", "intermediate", "advanced"].map((level) => <button key={level} onClick={() => setFilter(level)} className={`border px-3 py-2 text-[11px] ${filter === level ? "border-[#AFC9DE] bg-[#F1F6FA] text-[#477FAE]" : "border-[#E2E8EE] bg-white text-[#7F8F9D]"}`}>{levelLabel(level === "all" ? "all levels" : level)}</button>)}
      </div>
      {loading ? <div className="flex min-h-[220px] items-center justify-center gap-2 border border-[#E8ECF0] bg-white text-sm text-[#718092]"><LoaderCircle size={17} className="animate-spin"/>Loading learning paths...</div> : visiblePaths.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visiblePaths.map((path) => <article key={path.id} className="border border-[#E8ECF0] bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center bg-[#F1F6FA] text-[#6D98BC]"><GraduationCap size={20}/></div><span className="text-[10px] font-medium text-[#718DA5]">{levelLabel(path.level)}</span></div>
            <h2 className="mt-4 text-base font-semibold text-[#39495A]">{path.title}</h2><p className="mt-2 min-h-12 text-xs leading-6 text-[#8793A0]">{path.description}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-[#8C99A5]"><span className="inline-flex items-center gap-1"><Target size={12}/>{path.target_role}</span><span className="inline-flex items-center gap-1"><Clock3 size={12}/>{path.estimated_hours} hours</span><span className="inline-flex items-center gap-1"><BookOpen size={12}/>{path.module_count} modules</span></div>
            <div className="mt-5"><div className="flex justify-between text-[10px] text-[#8392A0]"><span>{path.is_enrolled ? `${path.completed_modules}/${path.module_count} modules complete` : "Not started"}</span><span>{path.progress_percent || 0}%</span></div><div className="mt-2 h-1.5 bg-[#EEF2F5]"><div className="h-full bg-[#83B3D8]" style={{width:`${path.progress_percent || 0}%`}}/></div></div>
            <div className="mt-5 flex gap-2"><button onClick={() => setSelectedSlug(path.slug)} className="flex-1 border border-[#DCE5ED] px-3 py-2.5 text-xs font-medium text-[#5D7891] hover:bg-[#F8FAFC]">View roadmap</button>{path.is_enrolled ? <button onClick={() => setSelectedSlug(path.slug)} className="flex-1 bg-[#477FAE] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#376F9F]">Continue learning</button> : <button onClick={() => handleEnroll(path)} disabled={!!busy} className="flex-1 bg-[#477FAE] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#376F9F] disabled:opacity-50">{busy === path.slug ? "Starting..." : "Start path"}</button>}</div>
          </article>)}
        </div>
      ) : <div className="border border-dashed border-[#DDE5EB] bg-white p-10 text-center"><BookOpen className="mx-auto text-[#91AFC8]"/><h3 className="mt-3 text-sm font-semibold text-[#46596B]">No learning paths available</h3><p className="mt-1 text-xs text-[#8B98A5]">Run the learning path seed command from your Django project.</p></div>}
    </div>
  );
}
