
import { useEffect, useState } from "react";
import { LoaderCircle, Save, UserRound } from "lucide-react";
import apiClient from "../api/apiClient";

const initialForm = {
  first_name: "",
  last_name: "",
  education: "",
  experience_level: "beginner",
  target_role: "",
  career_goal: "",
};

export default function Account() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    apiClient.get("/profile/")
      .then((response) => {
        if (!active) return;
        const data = response.data;

        setProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          education: data.education || "",
          experience_level: data.experience_level || "beginner",
          target_role: data.target_role || "",
          career_goal: data.career_goal || "",
        });
        setSkills(Array.isArray(data.skills) ? data.skills.join(", ") : "");
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.detail || "Unable to load your account.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setMessage("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      skills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    try {
      const response = await apiClient.patch("/profile/", payload);
      setProfile(response.data);
      setSkills(
        Array.isArray(response.data.skills)
          ? response.data.skills.join(", ")
          : ""
      );
      setMessage("Your account profile has been updated.");
    } catch (err) {
      const data = err.response?.data;
      setError(
        data
          ? Object.entries(data)
              .map(([key, value]) => `${key}: ${[].concat(value).join(" ")}`)
              .join(" ")
          : "Could not save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center gap-2 text-sm text-[#718092]">
        <LoaderCircle size={18} className="animate-spin" />
        Loading your account...
      </div>
    );
  }

  const inputClass =
    "mt-2 w-full rounded-md border border-[#DFE6EC] bg-white px-3 py-3 text-sm text-[#344354] outline-none focus:border-[#85AED0]";

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">
          YOUR PROFILE
        </p>
        <h1 className="mt-2 text-[26px] font-semibold text-[#293747]">
          My Account
        </h1>
        <p className="mt-1 text-sm text-[#8793A0]">
          Your registered account details and professional profile.
        </p>
      </div>

      <section className="border border-[#E8ECF0] bg-white p-5 sm:p-7">
        <div className="flex items-center gap-3 border-b border-[#EDF0F3] pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF2F8] text-[#477FAE]">
            <UserRound size={22} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#39495A]">
              Registered account
            </h2>
            <p className="mt-1 text-[11px] text-[#98A3AE]">
              Retrieved from your authenticated account
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            {message}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-[#536274]">Username</p>
            <div className={inputClass}>{profile?.username || "Not available"}</div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#536274]">Registered email</p>
            <div className={inputClass}>{profile?.email || "No email on account"}</div>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-[#98A3AE]">
          Email and username are read-only here. Your email is the address submitted during registration; it has not been independently verified.
        </p>
      </section>

      <form onSubmit={saveProfile} className="border border-[#E8ECF0] bg-white p-5 sm:p-7">
        <h2 className="text-sm font-semibold text-[#39495A]">
          Professional profile
        </h2>
        <p className="mt-1 text-[11px] text-[#98A3AE]">
          Keep this information updated to personalize your interview preparation.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#536274]">
            First name
            <input className={inputClass} name="first_name" value={form.first_name} onChange={updateField} />
          </label>

          <label className="text-xs font-medium text-[#536274]">
            Last name
            <input className={inputClass} name="last_name" value={form.last_name} onChange={updateField} />
          </label>

          <label className="text-xs font-medium text-[#536274]">
            Education
            <input className={inputClass} name="education" value={form.education} onChange={updateField} placeholder="e.g. B.E. Computer Engineering" />
          </label>

          <label className="text-xs font-medium text-[#536274]">
            Experience level
            <select className={inputClass} name="experience_level" value={form.experience_level} onChange={updateField}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>

          <label className="text-xs font-medium text-[#536274] sm:col-span-2">
            Target role
            <input className={inputClass} name="target_role" value={form.target_role} onChange={updateField} placeholder="e.g. Backend Developer" />
          </label>

          <label className="text-xs font-medium text-[#536274] sm:col-span-2">
            Skills
            <input className={inputClass} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, Django, SQL, REST APIs" />
            <span className="mt-1 block text-[10px] font-normal text-[#98A3AE]">
              Separate skills with commas.
            </span>
          </label>

          <label className="text-xs font-medium text-[#536274] sm:col-span-2">
            Career goal
            <textarea
              className={`${inputClass} min-h-28 resize-y`}
              name="career_goal"
              value={form.career_goal}
              onChange={updateField}
              placeholder="Describe what you want to achieve..."
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end border-t border-[#EDF0F3] pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-[#477FAE] px-5 py-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}
