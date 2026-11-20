
import { useEffect, useState } from "react";
import {
  Monitor, Palette, SlidersHorizontal, ShieldCheck, Save, LoaderCircle
} from "lucide-react";
import {
  getUserSettings,
  updateUserSettings,
  changeUserPassword,
  applyAppearance,
} from "../api/settingsService";

const defaults = {
  theme: "system",
  accent_color: "blue",
  density: "comfortable",
  default_interview_mode: "text",
  default_difficulty: "intermediate",
  default_question_count: 5,
  default_interview_type: "technical",
};

const selectClass =
  "mt-2 w-full rounded-md border border-[#DFE6EC] bg-white px-3 py-3 text-sm text-[#344354] outline-none focus:border-[#85AED0]";

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="border border-[#E8ECF0] bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3 border-b border-[#EDF0F3] pb-4">
        <Icon size={19} className="text-[#6F9BC5]" />
        <div>
          <h2 className="text-sm font-semibold text-[#39495A]">{title}</h2>
          <p className="mt-1 text-[11px] text-[#98A3AE]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, children }) {
  return (
    <label className="block text-xs font-medium text-[#536274]">
      {label}
      {children || (
        <select className={selectClass} value={value} onChange={onChange}>
          {[]}
        </select>
      )}
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let active = true;

    getUserSettings()
      .then((data) => {
        if (!active) return;
        const merged = { ...defaults, ...data };
        setSettings(merged);
        applyAppearance(merged);
      })
      .catch(() => {
        if (active) setError("Could not load your saved settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function update(field, value) {
    const next = { ...settings, [field]: value };
    setSettings(next);
    applyAppearance(next);
    setMessage("");
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const saved = await updateUserSettings(settings);
      const merged = { ...defaults, ...saved };
      setSettings(merged);
      applyAppearance(merged);
      setMessage("Your preferences have been saved to your account.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to save settings. Please check your connection."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      const response = await changeUserPassword(passwordData);
      setPasswordMessage(response.detail || "Password changed successfully.");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
    } catch (err) {
      const data = err.response?.data;
      const firstError = data
        ? Object.values(data).flat().join(" ")
        : "Unable to change password.";
      setPasswordError(firstError);
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center gap-2 text-sm text-[#718092]">
        <LoaderCircle size={18} className="animate-spin" />
        Loading account settings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6F9BC5]">
          PERSONALIZE PREPIT
        </p>
        <h1 className="mt-2 text-[26px] font-semibold text-[#293747]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#8793A0]">
          Your preferences are saved to your PrepIt account.
        </p>
      </div>

      {error && (
        <p role="alert" className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={saveSettings} className="space-y-5">
        <Section
          icon={Palette}
          title="Appearance"
          description="Choose how PrepIt looks on your devices."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Theme">
              <select
                className={selectClass}
                value={settings.theme}
                onChange={(e) => update("theme", e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">Use device setting</option>
              </select>
            </Field>

            <Field label="Accent colour">
              <select
                className={selectClass}
                value={settings.accent_color}
                onChange={(e) => update("accent_color", e.target.value)}
              >
                <option value="blue">Ocean blue</option>
                <option value="violet">Violet</option>
                <option value="teal">Teal</option>
                <option value="rose">Rose</option>
              </select>
            </Field>

            <Field label="Layout density">
              <select
                className={selectClass}
                value={settings.density}
                onChange={(e) => update("density", e.target.value)}
              >
                <option value="comfortable">Comfortable spacing</option>
                <option value="compact">Compact layout</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section
          icon={SlidersHorizontal}
          title="Interview preferences"
          description="These values will be preselected when you create an interview."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default interview mode">
              <select
                className={selectClass}
                value={settings.default_interview_mode}
                onChange={(e) => update("default_interview_mode", e.target.value)}
              >
                <option value="text">Text interview</option>
                <option value="voice">Voice interview</option>
              </select>
            </Field>

            <Field label="Default difficulty">
              <select
                className={selectClass}
                value={settings.default_difficulty}
                onChange={(e) => update("default_difficulty", e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>

            <Field label="Default number of questions">
              <select
                className={selectClass}
                value={settings.default_question_count}
                onChange={(e) => update("default_question_count", Number(e.target.value))}
              >
                {[5, 8, 10, 15, 20].map((count) => (
                  <option key={count} value={count}>{count} questions</option>
                ))}
              </select>
            </Field>

            <Field label="Default interview type">
              <select
                className={selectClass}
                value={settings.default_interview_type}
                onChange={(e) => update("default_interview_type", e.target.value)}
              >
                <option value="technical">Technical</option>
                <option value="hr">HR / Behavioral</option>
                <option value="project">Project-based</option>
                <option value="resume">Resume-based</option>
              </select>
            </Field>
          </div>
        </Section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-xs text-emerald-700">{message}</p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-[#477FAE] px-5 py-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
            Save preferences
          </button>
        </div>
      </form>

      <Section
        icon={ShieldCheck}
        title="Security"
        description="Change your account password. Use a strong, unique password."
      >
        <form onSubmit={submitPassword} className="space-y-4">
          {passwordError && (
            <p role="alert" className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {passwordError}
            </p>
          )}
          {passwordMessage && (
            <p role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              {passwordMessage}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["current_password", "Current password"],
              ["new_password", "New password"],
              ["confirm_new_password", "Confirm new password"],
            ].map(([key, label]) => (
              <label key={key} className="block text-xs font-medium text-[#536274]">
                {label}
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={passwordData[key]}
                  onChange={(e) => setPasswordData((p) => ({ ...p, [key]: e.target.value }))}
                  className={selectClass}
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-md border border-[#DCE5ED] px-4 py-2.5 text-xs font-semibold text-[#526B83] disabled:opacity-60"
          >
            {passwordSaving ? "Updating..." : "Change password"}
          </button>
        </form>
      </Section>
    </div>
  );
}
