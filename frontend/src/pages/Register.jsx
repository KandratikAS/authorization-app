import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register", { name, email, password });
      setSuccessMsg(res.data.message || "Registration successful! Please check your email.");
      // navigate("/login");
    } catch (e) {
      console.log(e.response);
      alert(JSON.stringify(e.response?.data || e.message));
    }
  };

  if (successMsg) {
    return (
      <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="card p-5 text-center">
          <h2 className="text-success mb-3">Registration Successful</h2>
          <p className="lead">{successMsg}</p>
          <Link to="/login" className="btn btn-primary mt-3">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        
        {/* LEFT — FORM */}
        <div className="col-md-5 d-flex align-items-center justify-content-center">
          <div style={{ width: 350 }}>
            <h2 className="mb-2">THE APP</h2>
            <p className="text-muted">Create your account</p>

            <form onSubmit={submit}>
              <input
                className="form-control mb-2"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />

              <input
                className="form-control mb-2"
                placeholder="E-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <input
                className="form-control mb-3"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />

              <button className="btn btn-primary w-100">
                Register
              </button>
            </form>

            <div className="mt-3 text-center">
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
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
