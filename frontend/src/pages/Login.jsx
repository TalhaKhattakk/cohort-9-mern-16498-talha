import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "./Signup.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setErrorMsg("Invalid email or password");
    }
  }

  return (
    <div className="auth-page">
      <h1 className="auth-title">TalhaNotes</h1>
      <p className="auth-tagline">Write your Notes Cleanly</p>

      <div className="auth-card">
        <div className="auth-tabs">
          <span className="auth-tab active">Log In</span>
          <Link to="/signup" className="auth-tab">Sign Up</Link>
        </div>

        {errorMsg && <p className="auth-error">{errorMsg}</p>}

        <form onSubmit={handleLogin}>
          <label className="auth-label">Email</label>
          <input
            type="email"
            className="auth-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="auth-row">
            <label className="auth-label">Password</label>
          </div>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-button">
            Log In <span className="auth-arrow">&rarr;</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;