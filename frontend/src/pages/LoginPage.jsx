import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login, registerBootstrap } = useAuth();
  const navigate = useNavigate();
  const [setupRequired, setSetupRequired] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [setupForm, setSetupForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/auth/bootstrap-status")
      .then((res) => setSetupRequired(Boolean(res.data.requiresBootstrap)))
      .catch(() => setSetupRequired(false))
      .finally(() => setStatusLoading(false));
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onBootstrapSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (setupForm.password !== setupForm.confirmPassword) {
      setError("Password and confirm password must match");
      return;
    }

    setSubmitting(true);
    try {
      await registerBootstrap({
        fullName: setupForm.fullName,
        email: setupForm.email,
        password: setupForm.password,
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create the first admin account");
    } finally {
      setSubmitting(false);
    }
  };

  if (statusLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={setupRequired ? onBootstrapSubmit : onSubmit}
        className="panel w-full max-w-md space-y-4 p-6"
      >
        <div>
          <h1 className="text-xl font-bold">Instrument Testing Tracker</h1>
          <p className="text-sm text-muted">
            {setupRequired
              ? "Create the first admin account to start using the application."
              : "Secure login for Admin, Tester, and Viewer roles"}
          </p>
        </div>

        {setupRequired ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                className="input-base"
                required
                value={setupForm.fullName}
                onChange={(e) => setSetupForm((curr) => ({ ...curr, fullName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                className="input-base"
                type="email"
                required
                value={setupForm.email}
                onChange={(e) => setSetupForm((curr) => ({ ...curr, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                className="input-base"
                type="password"
                required
                value={setupForm.password}
                onChange={(e) => setSetupForm((curr) => ({ ...curr, password: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <input
                className="input-base"
                type="password"
                required
                value={setupForm.confirmPassword}
                onChange={(e) =>
                  setSetupForm((curr) => ({ ...curr, confirmPassword: e.target.value }))
                }
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                className="input-base"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((curr) => ({ ...curr, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                className="input-base"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((curr) => ({ ...curr, password: e.target.value }))}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button disabled={submitting} className="btn-primary w-full" type="submit">
          {submitting
            ? setupRequired
              ? "Creating admin..."
              : "Signing in..."
            : setupRequired
              ? "Create First Admin"
              : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
