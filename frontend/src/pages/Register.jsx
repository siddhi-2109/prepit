
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { registerUser } from "../api/authService";

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

export default function Register({ onRegistered, onSwitchToLogin }) {

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await registerUser(formData);

      // Send the newly created username to the login page
      onRegistered(formData.username);

    } catch (err) {
      setError(getErrorMessage(err));

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5 py-10">

      <div className="w-full max-w-[470px]">

        {/* BRAND */}
        <div className="mb-7 flex flex-col items-center">

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

        {/* REGISTER CARD */}
        <div className="border border-[#E8ECF0] bg-white p-7 shadow-sm sm:p-9">

          <div className="mb-6 text-center">

            <h2 className="text-2xl font-semibold text-[#293747]">
              Create your account
            </h2>

            <p className="mt-2 text-sm text-[#8995A2]">
              Start preparing for your next opportunity.
            </p>

          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* FIRST AND LAST NAME */}
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="mb-2 block text-xs font-medium text-[#506071]">
                  First name
                </label>

                <input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                  className="w-full rounded-lg border border-[#E1E7EC] px-3 py-3 text-sm outline-none focus:border-[#7EACD1] focus:ring-2 focus:ring-[#EAF2F9]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#506071]">
                  Last name
                </label>

                <input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                  className="w-full rounded-lg border border-[#E1E7EC] px-3 py-3 text-sm outline-none focus:border-[#7EACD1] focus:ring-2 focus:ring-[#EAF2F9]"
                />
              </div>

            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#506071]">
                Email address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-[#E1E7EC] px-4 py-3 text-sm outline-none focus:border-[#7EACD1] focus:ring-2 focus:ring-[#EAF2F9]"
              />
            </div>

            {/* USERNAME */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#506071]">
                Username
              </label>

              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-[#E1E7EC] px-4 py-3 text-sm outline-none focus:border-[#7EACD1] focus:ring-2 focus:ring-[#EAF2F9]"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-[#E1E7EC] px-4 py-3 pr-12 text-sm outline-none focus:border-[#7EACD1] focus:ring-2 focus:ring-[#EAF2F9]"
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

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[#506071]">
                Confirm password
              </label>

              <input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Enter password again"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-[#E1E7EC] px-4 py-3 text-sm outline-none focus:border-[#7EACD1] focus:ring-2 focus:ring-[#EAF2F9]"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#477FAE] py-3 text-sm font-semibold text-white transition hover:bg-[#376F9F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={17} />}
            </button>

          </form>

          {/* LOGIN LINK */}
          <div className="mt-6 text-center">

            <p className="text-sm text-[#8793A0]">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="font-semibold text-[#477FAE] hover:underline"
              >
                Sign in
              </button>
            </p>

          </div>

        </div>

        <p className="mt-5 text-center text-xs text-[#A0A9B3]">
          Practice. Improve. Get hired.
        </p>

      </div>

    </div>
  );
}
