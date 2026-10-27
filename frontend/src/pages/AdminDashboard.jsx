
import { useEffect, useState } from "react";
import "./AdminDashboard.css";

const API = "http://localhost:5000/api";

export default function AdminDashboard() {
  const [email, setEmail] = useState("admin@campusconnect.edu");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("General");
  const [keywords, setKeywords] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Admin login failed");
      }

      setToken(data.token);
      setPassword("");
      setMessage("Login successful!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadFaqs() {
    try {
      const response = await fetch(`${API}/faqs`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load FAQs");
      }

      setFaqs(Array.isArray(data) ? data : data.faqs || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token) loadFaqs();
  }, [token]);

  async function addFaq(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          answer,
          category,
          keywords: keywords
            .split(",")
            .map((word) => word.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add FAQ");
      }

      setQuestion("");
      setAnswer("");
      setCategory("General");
      setKeywords("");
      setMessage("FAQ added successfully!");
      await loadFaqs();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken("");
    setFaqs([]);
    setMessage("Logged out successfully.");
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">CAMPUSCONNECT AI</p>
          <h1>Admin Dashboard</h1>
          <p>Manage college FAQs and help students find answers.</p>
        </div>

        {token && (
          <button className="admin-logout" onClick={logout}>
            Logout
          </button>
        )}
      </header>

      {message && (
        <div className="admin-message" role="status">
          {message}
        </div>
      )}

      {!token ? (
        <form className="admin-panel admin-login" onSubmit={login}>
          <h2>Admin Login</h2>
          <p>Sign in to manage college information.</p>

          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      ) : (
        <main className="admin-content">
          <section className="admin-stats">
            <div className="admin-stat-card">
              <span>Total FAQs</span>
              <strong>{faqs.length}</strong>
            </div>
            <div className="admin-stat-card">
              <span>Admin Status</span>
              <strong>Active</strong>
            </div>
          </section>

          <section className="admin-panel">
            <h2>Add a New FAQ</h2>
            <p>
              Add verified college information for students and the AI
              assistant.
            </p>

            <form onSubmit={addFaq}>
              <label htmlFor="faq-question">Question</label>
              <input
                id="faq-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="e.g. What are the college timings?"
                required
              />

              <label htmlFor="faq-answer">Answer</label>
              <textarea
                id="faq-answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Enter the official answer..."
                rows={4}
                required
              />

              <label htmlFor="faq-category">Category</label>
              <select
                id="faq-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>General</option>
                <option>Academics</option>
                <option>Examinations</option>
                <option>Placements</option>
                <option>Hostel</option>
                <option>Transport</option>
                <option>Fees</option>
                <option>Library</option>
              </select>

              <label htmlFor="faq-keywords">Keywords</label>
              <input
                id="faq-keywords"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="college, timings, working hours"
              />

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Add FAQ"}
              </button>
            </form>
          </section>

          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <h2>Existing FAQs</h2>
                <p>FAQs currently available to the student portal.</p>
              </div>
              <button type="button" onClick={loadFaqs}>
                Refresh
              </button>
            </div>

            {faqs.length === 0 ? (
              <p>No FAQs found. Add your first FAQ above.</p>
            ) : (
              <div className="admin-faq-list">
                {faqs.map((faq, index) => (
                  <article
                    className="admin-faq-item"
                    key={faq._id || faq.id || index}
                  >
                    <div>
                      <span className="admin-category">
                        {faq.category || "General"}
                      </span>
                      <h3>{faq.question}</h3>
                      <p>{faq.answer}</p>
                      {faq.keywords?.length > 0 && (
                        <small>
                          Keywords: {faq.keywords.join(", ")}
                        </small>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
