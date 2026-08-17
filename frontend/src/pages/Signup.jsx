import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "./Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setErrorMsg("");

    try {
      await axiosClient.post("/auth/signup", { name, email, password });
      navigate("/login");
    } catch (err) {
      console.log(err);
      setErrorMsg("Something went wrong, try again");
    }
  }

  return (
    <div className="auth-page">
      <h1 className="auth-title">TalhaNotes</h1>
      <p className="auth-tagline">Write your Notes Cleanly</p>


      <div className="auth-card">
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab">Log In</Link>
          <span className="auth-tab active">Sign Up</span>
        </div>

        {errorMsg && <p className="auth-error">{errorMsg}</p>}

        <form onSubmit={handleSignup}>
          <label className="auth-label">Name</label>
          <input
            type="text"
            className="auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="auth-label">Email</label>
          <input
            type="email"
            className="auth-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="auth-label">Password</label>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-button">
            Sign Up <span className="auth-arrow">&rarr;</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;