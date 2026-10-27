import { useState, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
  FileText,
  HelpCircle,
  Upload,
  Palette,
  CheckCircle2,
  XCircle,
  PlusCircle,
  LogOut,
  ArrowLeft,
  Search,
  Users,
} from "lucide-react";
import "./AdminDashboard.css";

const API = "/api";

export default function AdminDashboard({ onBack, _defaultCollege = null }) {
  // Mode: "college_admin" or "super_admin"
  const [adminType, setAdminType] = useState("college_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [adminProfile, setAdminProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Active tab within dashboard
  const [activeTab, setActiveTab] = useState("notices");

  // College Admin state
  const [notices, setNotices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("General");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("General");
  const [faqKeywords, setFaqKeywords] = useState("");
  const [uploadCategory, setUploadCategory] = useState("General");
  const [selectedFile, setSelectedFile] = useState(null);

  // Branding state
  const [brandingTagline, setBrandingTagline] = useState("");
  const [brandingPrimary, setBrandingPrimary] = useState("#05192e");
  const [brandingSecondary, setBrandingSecondary] = useState("#d4af37");

  // Super Admin state
  const [collegesList, setCollegesList] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [superSearch, setSuperSearch] = useState("");
  const [provisionName, setProvisionName] = useState("");
  const [provisionEmail, setProvisionEmail] = useState("");
  const [provisionPassword, setProvisionPassword] = useState("");
  const [provisionCollegeId, setProvisionCollegeId] = useState("");

  const clearMessages = () => {
    setMessage("");
    setErrorMsg("");
  };

  // Login handler
  async function handleLogin(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const endpoint =
      adminType === "super_admin"
        ? `${API}/admin/login`
        : `${API}/college-admin/login`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      setToken(data.token);
      setAdminProfile(data.admin);
      setPassword("");
      setMessage(`Welcome back, ${data.admin.name || data.admin.email}!`);

      if (adminType === "super_admin") {
        fetchSuperAdminData(data.token);
      } else {
        fetchCollegeAdminData(data.token, data.admin.collegeId);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch data for College Admin
  const fetchCollegeAdminData = useCallback(async (authToken, colId) => {
    try {
      const noticesEndpoint = colId
        ? `${API}/colleges/${colId}/notices`
        : `${API}/notices`;
      const faqsEndpoint = colId
        ? `${API}/colleges/${colId}/faqs`
        : `${API}/faqs`;

      const [resN, resF] = await Promise.all([
        fetch(noticesEndpoint),
        fetch(faqsEndpoint),
      ]);

      const dataN = await resN.json();
      const dataF = await resF.json();

      setNotices(dataN.notices || []);
      setFaqs(dataF.faqs || []);
    } catch (err) {
      console.error("Failed to load college admin data:", err);
    }
  }, []);

  // Fetch data for Super Admin
  const fetchSuperAdminData = useCallback(async (authToken) => {
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [resCol, resStats] = await Promise.all([
        fetch(`${API}/superadmin/colleges`, { headers }),
        fetch(`${API}/superadmin/stats`, { headers }),
      ]);

      const dataCol = await resCol.json();
      const dataStats = await resStats.json();

      setCollegesList(dataCol.colleges || []);
      setPlatformStats(dataStats);
      if (dataCol.colleges?.length > 0 && !provisionCollegeId) {
        setProvisionCollegeId(dataCol.colleges[0]._id);
      }
    } catch (err) {
      console.error("Failed to load super admin data:", err);
    }
  }, [provisionCollegeId]);

  // College Admin: Create Notice
  async function handleCreateNotice(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch(`${API}/college-admin/notices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          category: noticeCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to publish notice");

      setMessage(data.message || "Notice published successfully!");
      setNoticeTitle("");
      setNoticeContent("");
      fetchCollegeAdminData(token, adminProfile?.collegeId);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // College Admin: Create FAQ
  async function handleCreateFaq(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch(`${API}/college-admin/faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: faqQuestion,
          answer: faqAnswer,
          category: faqCategory,
          keywords: faqKeywords.split(",").map((k) => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create FAQ");

      setMessage(data.message || "FAQ created successfully!");
      setFaqQuestion("");
      setFaqAnswer("");
      setFaqKeywords("");
      fetchCollegeAdminData(token, adminProfile?.collegeId);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // College Admin: Upload Document
  async function handleUploadDocument(e) {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please choose a PDF or DOCX file to upload.");
      return;
    }
    clearMessages();
    setLoading(true);

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("category", uploadCategory);

    try {
      const res = await fetch(`${API}/college-admin/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Document upload failed");

      setMessage(data.message || "Document uploaded and parsed for campus AI!");
      setSelectedFile(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // College Admin: Update Branding
  async function handleUpdateBranding(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch(`${API}/college-admin/branding`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tagline: brandingTagline,
          primaryColor: brandingPrimary,
          secondaryColor: brandingSecondary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Branding update failed");

      setMessage("College branding updated successfully!");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Super Admin: Update College Status (Approve / Activate / Deactivate)
  async function handleToggleCollegeStatus(colId, newStatus, isApproved) {
    clearMessages();
    try {
      const res = await fetch(`${API}/superadmin/colleges/${colId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, isApproved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Status update failed");

      setMessage(`College status updated to ${newStatus}`);
      fetchSuperAdminData(token);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  // Super Admin: Provision College Admin
  async function handleProvisionAdmin(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch(
        `${API}/superadmin/colleges/${provisionCollegeId}/admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: provisionName,
            email: provisionEmail,
            password: provisionPassword,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Provisioning failed");

      setMessage(data.message || "College administrator provisioned!");
      setProvisionName("");
      setProvisionEmail("");
      setProvisionPassword("");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken("");
    setAdminProfile(null);
    clearMessages();
    setMessage("Logged out successfully.");
  }

  return (
    <div className="admin-container">
      {/* Top Banner */}
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <button className="admin-back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Return to CampusConnectAI
          </button>
          <span>
            <ShieldCheck size={16} /> CampusConnectAI Administrative Suite
          </span>
        </div>
      </div>

      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div>
            <span className="admin-badge">
              {adminProfile
                ? adminProfile.role === "college_admin"
                  ? `College Admin: ${adminProfile.collegeName || "Tenant"}`
                  : "Platform Super Administrator"
                : "Portal Authentication"}
            </span>
            <h1>
              {adminProfile
                ? adminProfile.role === "college_admin"
                  ? `${adminProfile.collegeName || "College"} Admin Console`
                  : "Platform Super Admin Console"
                : "CampusConnectAI Portal Sign-In"}
            </h1>
            <p>
              {adminProfile
                ? "Manage institution notices, FAQs, knowledge documents, and platform oversight."
                : "Select your administrative tier and enter your authorized credentials."}
            </p>
          </div>

          {token && (
            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={16} /> Sign Out
            </button>
          )}
        </header>

        {/* Feedback Messages */}
        {message && <div className="alert alert-success">{message}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        {/* Login State */}
        {!token ? (
          <div className="admin-login-wrapper">
            <div className="login-tab-bar">
              <button
                className={`login-tab-btn ${
                  adminType === "college_admin" ? "tab-active" : ""
                }`}
                onClick={() => {
                  setAdminType("college_admin");
                  clearMessages();
                }}
              >
                <Building2 size={17} /> College Administrator
              </button>
              <button
                className={`login-tab-btn ${
                  adminType === "super_admin" ? "tab-active" : ""
                }`}
                onClick={() => {
                  setAdminType("super_admin");
                  clearMessages();
                }}
              >
                <ShieldCheck size={17} /> Platform Super Admin
              </button>
            </div>

            <form className="admin-form-card" onSubmit={handleLogin}>
              <h3>
                {adminType === "college_admin"
                  ? "College Admin Authentication"
                  : "Super Admin Platform Login"}
              </h3>
              <p className="form-subtext">
                {adminType === "college_admin"
                  ? "Access your assigned college dashboard to manage notices, FAQs, and documents."
                  : "Manage institutional onboarding, college approvals, and platform status."}
              </p>

              <div className="form-group">
                <label>Authorized Email Address</label>
                <input
                  type="email"
                  required
                  placeholder={
                    adminType === "college_admin"
                      ? "admin@apextech.edu"
                      : "admin@campusconnect.edu"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary-action"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Authenticate & Open Console"}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard State */
          <div className="admin-dashboard-body">
            {/* If College Admin */}
            {adminProfile?.role === "college_admin" && (
              <>
                <nav className="console-nav">
                  <button
                    className={`console-tab ${
                      activeTab === "notices" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("notices")}
                  >
                    <FileText size={17} /> College Notices ({notices.length})
                  </button>
                  <button
                    className={`console-tab ${
                      activeTab === "faqs" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("faqs")}
                  >
                    <HelpCircle size={17} /> Student FAQs ({faqs.length})
                  </button>
                  <button
                    className={`console-tab ${
                      activeTab === "docs" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("docs")}
                  >
                    <Upload size={17} /> Campus AI Documents
                  </button>
                  <button
                    className={`console-tab ${
                      activeTab === "branding" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("branding")}
                  >
                    <Palette size={17} /> Brand & Theme
                  </button>
                </nav>

                {/* Tab: Notices */}
                {activeTab === "notices" && (
                  <div className="console-grid">
                    <form className="console-card" onSubmit={handleCreateNotice}>
                      <h3>
                        <PlusCircle size={18} /> Publish New College Notice
                      </h3>
                      <p className="card-desc">
                        Post announcements visible exclusively to students
                        enrolled at {adminProfile.collegeName}.
                      </p>

                      <div className="form-group">
                        <label>Notice Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mid-Term Examination Schedule"
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Category</label>
                        <select
                          value={noticeCategory}
                          onChange={(e) => setNoticeCategory(e.target.value)}
                        >
                          <option value="General">General Announcement</option>
                          <option value="Exam">Examinations</option>
                          <option value="Placements">Placements & Careers</option>
                          <option value="Events">Campus Events</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Notice Content</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Full announcement details..."
                          value={noticeContent}
                          onChange={(e) => setNoticeContent(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-primary-action"
                        disabled={loading}
                      >
                        {loading ? "Publishing..." : "Publish Notice"}
                      </button>
                    </form>

                    <div className="console-card">
                      <h3>Active College Notices</h3>
                      <div className="list-stream">
                        {notices.map((n) => (
                          <div key={n._id} className="stream-item">
                            <span className="stream-pill">{n.category}</span>
                            <strong>{n.title}</strong>
                            <p>{n.content}</p>
                            <small>
                              {n.publishedAt
                                ? new Date(n.publishedAt).toLocaleDateString()
                                : "Recent"}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: FAQs */}
                {activeTab === "faqs" && (
                  <div className="console-grid">
                    <form className="console-card" onSubmit={handleCreateFaq}>
                      <h3>
                        <PlusCircle size={18} /> Add College FAQ
                      </h3>
                      <p className="card-desc">
                        Provide official answers and knowledge base entries for
                        your campus AI companion.
                      </p>

                      <div className="form-group">
                        <label>Student Question</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Where can I collect my hall ticket?"
                          value={faqQuestion}
                          onChange={(e) => setFaqQuestion(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Category</label>
                        <select
                          value={faqCategory}
                          onChange={(e) => setFaqCategory(e.target.value)}
                        >
                          <option value="General">General</option>
                          <option value="Academics">Academics</option>
                          <option value="Examinations">Examinations</option>
                          <option value="Placements">Placements</option>
                          <option value="Campus Services">
                            Campus Services
                          </option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Official Answer</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Accurate, concise college response..."
                          value={faqAnswer}
                          onChange={(e) => setFaqAnswer(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Search Keywords (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="hall ticket, admit card, exam"
                          value={faqKeywords}
                          onChange={(e) => setFaqKeywords(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-primary-action"
                        disabled={loading}
                      >
                        {loading ? "Adding..." : "Add FAQ Entry"}
                      </button>
                    </form>

                    <div className="console-card">
                      <h3>Available FAQs</h3>
                      <div className="list-stream">
                        {faqs.map((f) => (
                          <div key={f._id} className="stream-item">
                            <span className="stream-pill">{f.category}</span>
                            <strong>{f.question}</strong>
                            <p>{f.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Documents */}
                {activeTab === "docs" && (
                  <div className="console-card max-card">
                    <h3>
                      <Upload size={18} /> Ingest Campus Knowledge Document
                    </h3>
                    <p className="card-desc">
                      Upload institutional policy handbooks, academic regulations,
                      or syllabi in PDF or DOCX format. Extracted text will be
                      indexed strictly for {adminProfile.collegeName}&apos;s Campus AI.
                    </p>

                    <form onSubmit={handleUploadDocument}>
                      <div className="form-group">
                        <label>Document Category</label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value)}
                        >
                          <option value="General">General Handbook</option>
                          <option value="Academic">Academic Regulations</option>
                          <option value="Exams">Examination Guidelines</option>
                          <option value="Placements">Placement Rules</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Choose File (.pdf or .docx max 10MB)</label>
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          required
                          onChange={(e) =>
                            setSelectedFile(e.target.files[0] || null)
                          }
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-primary-action"
                        disabled={loading || !selectedFile}
                      >
                        {loading ? "Parsing & Indexing..." : "Upload & Ingest Document"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Tab: Branding */}
                {activeTab === "branding" && (
                  <div className="console-card max-card">
                    <h3>
                      <Palette size={18} /> Customize College Portal Branding
                    </h3>
                    <p className="card-desc">
                      Configure your college&apos;s primary theme accents and official
                      tagline.
                    </p>

                    <form onSubmit={handleUpdateBranding}>
                      <div className="form-group">
                        <label>College Tagline</label>
                        <input
                          type="text"
                          placeholder="Excellence in Technology and Leadership"
                          value={brandingTagline}
                          onChange={(e) => setBrandingTagline(e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Primary Theme Color</label>
                          <input
                            type="color"
                            value={brandingPrimary}
                            onChange={(e) => setBrandingPrimary(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Secondary Accent Color</label>
                          <input
                            type="color"
                            value={brandingSecondary}
                            onChange={(e) => setBrandingSecondary(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn-primary-action"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Branding Changes"}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* If Platform Super Admin */}
            {adminProfile?.role === "admin" && (
              <div className="super-admin-layout">
                {/* Stats Bar */}
                {platformStats && (
                  <div className="stats-row">
                    <div className="stat-card">
                      <Building2 size={24} />
                      <div>
                        <h3>{platformStats.colleges || 0}</h3>
                        <p>Total Colleges</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <Users size={24} />
                      <div>
                        <h3>{platformStats.students || 0}</h3>
                        <p>Total Enrolled Students</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <FileText size={24} />
                      <div>
                        <h3>{platformStats.notices || 0}</h3>
                        <p>College Notices</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <HelpCircle size={24} />
                      <div>
                        <h3>{platformStats.faqs || 0}</h3>
                        <p>Total FAQs</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* College Management Section */}
                <div className="console-grid">
                  <div className="console-card">
                    <div className="card-header-row">
                      <h3>Registered Colleges Directory</h3>
                      <div className="search-mini">
                        <Search size={14} />
                        <input
                          type="text"
                          placeholder="Search colleges..."
                          value={superSearch}
                          onChange={(e) => setSuperSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="colleges-table-stream">
                      {collegesList
                        .filter(
                          (c) =>
                            !superSearch ||
                            c.name
                              ?.toLowerCase()
                              .includes(superSearch.toLowerCase()) ||
                            c.code
                              ?.toLowerCase()
                              .includes(superSearch.toLowerCase())
                        )
                        .map((c) => (
                          <div key={c._id} className="college-admin-row">
                            <div>
                              <strong>{c.name}</strong>
                              <small>
                                Code: {c.code} · Slug: {c.slug} · City:{" "}
                                {c.location?.city || "Unspecified"}
                              </small>
                              <span
                                className={`status-pill pill-${c.status}`}
                              >
                                {c.status}
                              </span>
                            </div>

                            <div className="row-actions">
                              {c.status !== "active" ? (
                                <button
                                  className="btn-action-green"
                                  onClick={() =>
                                    handleToggleCollegeStatus(
                                      c._id,
                                      "active",
                                      true
                                    )
                                  }
                                >
                                  <CheckCircle2 size={14} /> Activate
                                </button>
                              ) : (
                                <button
                                  className="btn-action-red"
                                  onClick={() =>
                                    handleToggleCollegeStatus(
                                      c._id,
                                      "inactive",
                                      false
                                    )
                                  }
                                >
                                  <XCircle size={14} /> Deactivate
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Provision College Admin Card */}
                  <form
                    className="console-card"
                    onSubmit={handleProvisionAdmin}
                  >
                    <h3>Provision College Administrator</h3>
                    <p className="card-desc">
                      Assign a new administrative lead to manage an authorized
                      college portal.
                    </p>

                    <div className="form-group">
                      <label>Target College</label>
                      <select
                        value={provisionCollegeId}
                        onChange={(e) => setProvisionCollegeId(e.target.value)}
                        required
                      >
                        {collegesList.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Administrator Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Rajesh Kumar"
                        value={provisionName}
                        onChange={(e) => setProvisionName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Administrator Email</label>
                      <input
                        type="email"
                        required
                        placeholder="admin@college.edu"
                        value={provisionEmail}
                        onChange={(e) => setProvisionEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Temporary Password (min 8 characters)</label>
                      <input
                        type="password"
                        required
                        placeholder="Min 8 characters"
                        value={provisionPassword}
                        onChange={(e) => setProvisionPassword(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-action"
                      disabled={loading}
                    >
                      {loading ? "Provisioning..." : "Assign College Admin"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
