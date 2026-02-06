import { useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async e => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/forgot", { email });
      setDone(true);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4" style={{ maxWidth: 420, width: "100%" }}>
        <h3 className="mb-3">Forgot password</h3>

        {done ? (
          <>
            <p>If the account exists, a password reset link has been sent to your email. Check your inbox.</p>
            <Link to="/login" className="btn btn-primary mt-2">Back to login</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <input
              className="form-control mb-2"
              placeholder="Your e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <div className="text-danger mb-2">{error}</div>}
            <button className="btn btn-primary w-100">Send link</button>
          </form>
        )}
      </div>
    </div>
  );
}