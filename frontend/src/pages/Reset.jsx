import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function Reset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setError("Token is missing");
  }, [token]);

  const submit = async e => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset", { token, password });
      setOk(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4" style={{ maxWidth: 420, width: "100%" }}>
        <h3 className="mb-3">Reset password</h3>

        {ok ? (
          <>
            <p className="text-success">Password successfully updated! Redirecting to login...</p>
            <Link to="/login" className="btn btn-primary mt-2">Back to login</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <input
              className="form-control mb-2"
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-danger mb-2">{error}</div>}
            <button className="btn btn-primary w-100" disabled={!token}>Change password</button>
          </form>
        )}
      </div>
    </div>
  );
}