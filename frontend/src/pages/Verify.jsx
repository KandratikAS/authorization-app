import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const verified = searchParams.get("verified"); 
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (verified === "true") {
      setStatus("success");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (!token) {
      setStatus("error");
      setError("No token provided");
      return;
    }

    api.post("/auth/verify", { token })
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch(e => {
        setStatus("error");
        setError(e.response?.data?.error || e.message);
      });
  }, [token, verified, navigate]);

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 text-center" style={{ maxWidth: 500 }}>
        {status === "verifying" && <h3>Verifying your email...</h3>}
        {status === "success" && (
          <div>
            <h3 className="text-success">Email verified successfully!</h3>
            <p>Redirecting to login...</p>
          </div>
        )}
        {status === "error" && (
          <div>
            <h3 className="text-danger">Verification failed</h3>
            <p>{error}</p>
            <Link to="/login" className="btn btn-secondary mt-2">Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
