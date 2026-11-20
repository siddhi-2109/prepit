
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { loginUser } from "../api/authService";

function getErrorMessage(error) {
  const data = error.response?.data;

  if (!data) {
    return "Unable to connect to the server. Please try again.";
  }

  if (data.detail) {
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages)
        ? messages.join(" ")
        : String(messages);

      return `${field}: ${message}`;
    })
    .join(" ");
}

export default function Login({
  onLoginSuccess,
  onSwitchToRegister,
  initialUsername = "",
  notice = "",
}) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginUser({
        username,
        password,
      });

      onLoginSuccess();

    } catch (err) {
      setError(getErrorMessage(err));

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5 py-10">

      <div className="w-full max-w-[430px]">

        {/* BRAND */}
        <div className="mb-9 flex flex-col items-center">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#DFE9F1] bg-white">
            <span className="text-3xl font-semibold text-[#477FAE]">
              P
            </span>
          </div>

          <h1 className="mt-3 text-xl font-semibold text-[#283747]">
            PrepIt
          </h1>

          <p className="mt-1 text-[10px] tracking-[0.15em] text-[#9AA6B2]">
            INTERVIEW PREPARATION
          </p>

        </div>

        {/* LOGIN CARD */}
        <div className="border border-[#E8ECF0] bg-white p-7 shadow-sm sm:p-9">

          <div className="mb-7 text-center">

            <h2 className="text-2xl font-semibold text-[#293747]">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-[#8995A2]">
              Sign in to continue your preparation.
            </p>

          </div>

          {/* REGISTRATION SUCCESS */}
          {notice && (
            <div className="mb-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">
              {notice}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* USERNAME */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#506071]">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-[#E1E7EC] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#A4ADB7] focus:border-[#7EACD1] focus:ring-2 focus:ring-[#EAF2F9]"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#506071]">
                Password
              </label>

              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-[#E1E7EC] bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-[#A4ADB7] focus:border-[#7EACD1] focus:ring-2 focus:ring-[#EAF2F9]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D9AA7]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />
                  }
                </button>

              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#477FAE] py-3 text-sm font-semibold text-white transition hover:bg-[#376F9F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={17} />}
            </button>

          </form>

          {/* REGISTER LINK */}
          <div className="mt-7 text-center">

            <p className="text-sm text-[#8793A0]">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToRegister}
                className="font-semibold text-[#477FAE] hover:underline"
              >
                Create account
              </button>
            </p>

          </div>

        </div>

        {/* FOOTER */}
        <p className="mt-6 text-center text-xs text-[#A0A9B3]">
          Practice. Improve. Get hired.
        </p>

      </div>

    </div>
  );
}
