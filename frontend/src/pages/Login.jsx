import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">

        {/* LEFT — FORM */}
        <div className="col-md-5 d-flex align-items-center justify-content-center">
          <div style={{ width: 360 }}>

            {/* Logo / title */}
            <h2 className="fw-bold text-primary mb-4">THE APP</h2>

            <p className="text-muted mb-1">Start your journey</p>
            <h4 className="mb-4">Sign In to The App</h4>

            <form onSubmit={submit}>
              <div className="mb-3 position-relative">
                <input
                  className="form-control"
                  placeholder="E-mail"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3 position-relative">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="remember"
                />
                <label className="form-check-label" htmlFor="remember">
                  Remember me
                </label>
              </div>

              <button className="btn btn-primary w-100 mb-3">
                Sign In
              </button>
            </form>

            <div className="d-flex justify-content-between">
              <Link to="/register">Sign up</Link>
              <span className="text-muted">Forgot password?</span>
            </div>
          </div>
        </div>

        {/* RIGHT — IMAGE */}
        <div
          className="col-md-7 d-none d-md-block"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1542281286-9e0a16bb7366)",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
      </div>
    </div>
  );
}
