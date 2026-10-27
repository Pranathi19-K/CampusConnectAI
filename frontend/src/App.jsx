import { useEffect, useState, useCallback } from "react";
import {
  GraduationCap,
  Bot,
  ArrowRight,
  BookOpen,
  Bell,
  Menu,
  X,
  CalendarDays,
  CircleHelp,
  ShieldCheck,
  Landmark,
  MessageCircle,
  Library,
  FlaskConical,
  LoaderCircle,
  ExternalLink,
  Building2,
  Search,
  MapPin,
  LogIn,
  LogOut,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import "./App.css";
import AdminDashboard from "./pages/AdminDashboard";

const API = "/api";

const programs = [
  {
    title: "Academic Resources",
    description: "Curriculum regulations, syllabus documents, and learning resources.",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=85",
    icon: BookOpen,
  },
  {
    title: "Campus Library & Journals",
    description: "Central library catalog, digital access, and 24/7 study halls.",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=85",
    icon: Library,
  },
  {
    title: "Research Labs & Innovation",
    description: "Specialized laboratories, incubator facilities, and tech project grants.",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=85",
    icon: FlaskConical,
  },
];

function App() {
  // Navigation & College State
  const [page, setPage] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [directorySearch, setDirectorySearch] = useState("");

  // Student Auth State
  const [studentUser, setStudentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("campusconnect_student");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [_studentToken, setStudentToken] = useState(() => {
    return localStorage.getItem("campusconnect_student_token") || "";
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRollNumber, setAuthRollNumber] = useState("");
  const [authDepartment, setAuthDepartment] = useState("Computer Science");
  const [authYear, setAuthYear] = useState(1);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Institution Registration Modal
  const [showRegisterCollegeModal, setShowRegisterCollegeModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColCode, setNewColCode] = useState("");
  const [newColCity, setNewColCity] = useState("");
  const [newColEmail, setNewColEmail] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [regColLoading, setRegColLoading] = useState(false);
  const [regColMsg, setRegColMsg] = useState("");

  // AI Chat & Resource State
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  // Fetch directory of colleges on mount
  useEffect(() => {
    async function loadColleges() {
      try {
        setCollegesLoading(true);
        const res = await fetch(`${API}/colleges`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.colleges || [];
        setColleges(list);

        // If previously saved college exists in localStorage, restore it
        const savedSlug = localStorage.getItem("campusconnect_college_slug");
        if (savedSlug && list.length > 0) {
          const match = list.find((c) => c.slug === savedSlug || c._id === savedSlug);
          if (match) setSelectedCollege(match);
        }
      } catch (err) {
        console.error("Failed to load colleges directory:", err);
      } finally {
        setCollegesLoading(false);
      }
    }

    loadColleges();
  }, []);

  // Fetch notices or FAQs whenever page or selectedCollege changes
  const loadResources = useCallback(async () => {
    if (page !== "Home" && page !== "Notices" && page !== "FAQs") return;

    setDataLoading(true);
    setDataError("");

    try {
      const colId = selectedCollege?._id;
      const endpoint =
        page === "FAQs"
          ? colId
            ? `${API}/colleges/${colId}/faqs`
            : `${API}/faqs`
          : colId
          ? `${API}/colleges/${colId}/notices`
          : `${API}/notices`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load information.");
      }

      const list = Array.isArray(data)
        ? data
        : data.notices || data.faqs || data.data || [];

      if (page === "Notices" || page === "Home") {
        setNotices(list);
      }
      if (page === "FAQs") {
        setFaqs(list);
      }
    } catch (error) {
      setDataError(error.message || "Backend service is currently unavailable.");
    } finally {
      setDataLoading(false);
    }
  }, [page, selectedCollege]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCollege = (col) => {
    setSelectedCollege(col);
    if (col) {
      localStorage.setItem("campusconnect_college_slug", col.slug);
    } else {
      localStorage.removeItem("campusconnect_college_slug");
    }
    setMessages([]);
    navigate("Home");
  };

  // Student Authentication handler
  async function handleStudentAuth(e) {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    const colId = selectedCollege?._id;
    const endpoint =
      authMode === "register"
        ? colId
          ? `${API}/colleges/${colId}/students/register`
          : `${API}/students/register`
        : colId
        ? `${API}/colleges/${colId}/students/login`
        : `${API}/students/login`;

    const payload =
      authMode === "register"
        ? {
            name: authName,
            email: authEmail,
            rollNumber: authRollNumber,
            department: authDepartment,
            year: Number(authYear),
            password: authPassword,
            collegeId: colId,
          }
        : {
            email: authEmail,
            password: authPassword,
            collegeId: colId,
          };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (authMode === "register") {
        setAuthSuccess("Registration successful! You may now sign in.");
        setAuthMode("login");
      } else {
        setStudentUser(data.student);
        setStudentToken(data.token);
        localStorage.setItem("campusconnect_student", JSON.stringify(data.student));
        localStorage.setItem("campusconnect_student_token", data.token);
        setShowAuthModal(false);
        setAuthPassword("");
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleStudentLogout() {
    setStudentUser(null);
    setStudentToken("");
    localStorage.removeItem("campusconnect_student");
    localStorage.removeItem("campusconnect_student_token");
  }

  // Institution Onboarding Submission
  async function handleRegisterCollege(e) {
    e.preventDefault();
    setRegColLoading(true);
    setRegColMsg("");

    try {
      const res = await fetch(`${API}/colleges/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newColName,
          code: newColCode,
          city: newColCity,
          contactEmail: newColEmail,
          description: newColDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit registration");

      setRegColMsg(data.message || "Registration submitted for super-admin review!");
      setNewColName("");
      setNewColCode("");
      setNewColCity("");
      setNewColEmail("");
      setNewColDesc("");
    } catch (err) {
      setRegColMsg(`Error: ${err.message}`);
    } finally {
      setRegColLoading(false);
    }
  }

  // Ask AI Chat handler (strictly scoped to selected college)
  async function askAI(text = question) {
    const prompt = text.trim();
    if (!prompt || loading) return;

    setQuestion("");
    setPage("Ask AI");
    setMessages((old) => [...old, { role: "user", text: prompt }]);
    setLoading(true);

    const colId = selectedCollege?._id;
    const endpoint = colId
      ? `${API}/colleges/${colId}/chat/ask`
      : `${API}/chat/ask`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          collegeId: colId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to get an answer.");
      }

      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources || [],
          mode: data.mode || "ai",
        },
      ]);
    } catch (error) {
      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          text:
            error.message ||
            "Unable to connect to campus AI. Please verify server connectivity.",
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Render notice/faq cards
  const renderResources = (items, type) => {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          {type === "Notices" ? <Bell size={35} /> : <CircleHelp size={35} />}
          <h3>No {type.toLowerCase()} published yet</h3>
          <p>
            {selectedCollege
              ? `Official updates for ${selectedCollege.name} will appear here.`
              : "College information will appear here once published by college administration."}
          </p>
        </div>
      );
    }

    return (
      <div className="resource-grid">
        {items.map((item, index) => (
          <article
            className="resource-card"
            key={item._id || item.id || index}
          >
            <span className="resource-icon">
              {type === "Notices" ? (
                <CalendarDays size={23} />
              ) : (
                <CircleHelp size={23} />
              )}
            </span>

            <small className="resource-category">
              {item.category || type}
            </small>

            <h3>
              {item.title || item.question || item.name || "College Resource"}
            </h3>

            <p>
              {item.content ||
                item.description ||
                item.answer ||
                "More information is available through college administration."}
            </p>

            {item.publishedAt && (
              <time>
                {new Date(item.publishedAt).toLocaleDateString()}
              </time>
            )}
          </article>
        ))}
      </div>
    );
  };

  // If Admin view is active
  if (page === "Admin") {
    return (
      <AdminDashboard
        defaultCollege={selectedCollege}
        onBack={() => navigate("Home")}
      />
    );
  }

  const campusHeroImg =
    selectedCollege?.branding?.campusImage ||
    "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=90";

  return (
    <div className="campus-app">
      {/* Utility Top Bar */}
      <div className="utility-bar">
        <div className="container utility-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>
              <Landmark size={15} />{" "}
              {selectedCollege ? (
                <>
                  <strong>{selectedCollege.name}</strong>
                  <span className="utility-divider">|</span> Student Portal
                </>
              ) : (
                <>CampusConnectAI Multi-College Platform</>
              )}
            </span>

            {selectedCollege && (
              <button
                className="btn-switch-college"
                onClick={() => handleSelectCollege(null)}
                title="View all colleges"
              >
                <ArrowRight size={12} style={{ transform: "rotate(180deg)" }} /> Switch College
              </button>
            )}
          </div>

          <div className="utility-links">
            {selectedCollege && (
              <>
                <button onClick={() => navigate("Notices")}>Notices</button>
                <button onClick={() => navigate("FAQs")}>FAQs</button>
                <button onClick={() => navigate("Ask AI")}>Campus AI Helpdesk</button>
              </>
            )}

            {studentUser ? (
              <div className="student-user-badge">
                <span>
                  👤 {studentUser.name} ({studentUser.rollNumber})
                </span>
                <button
                  className="btn-student-logout"
                  onClick={handleStudentLogout}
                >
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            ) : selectedCollege ? (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
              >
                <LogIn size={13} style={{ marginRight: 4 }} /> Student Sign In
              </button>
            ) : null}

            <button onClick={() => navigate("Admin")}>Admin Portal</button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="site-header">
        <div className="container header-inner">
          <button
            className="brand"
            onClick={() => navigate("Home")}
            aria-label="CampusConnectAI home"
          >
            <span className="brand-mark">
              <GraduationCap size={30} />
            </span>

            <span>
              <strong>
                {selectedCollege ? selectedCollege.name : (
                  <>CampusConnect<span className="brand-ai">AI</span></>
                )}
              </strong>
              <small>
                {selectedCollege
                  ? selectedCollege.tagline || "INTELLIGENT CAMPUS PORTAL"
                  : "MULTI-COLLEGE CAMPUS COMPANION"}
              </small>
            </span>
          </button>

          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>

          <nav className={`main-nav ${mobileOpen ? "nav-open" : ""}`}>
            {selectedCollege ? (
              <>
                {["Home", "Academics", "Notices", "FAQs", "Campus Life"].map(
                  (item) => (
                    <button
                      key={item}
                      className={page === item ? "nav-active" : ""}
                      onClick={() => navigate(item)}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  className="nav-ai-button"
                  onClick={() => navigate("Ask AI")}
                >
                  <Bot size={17} /> Ask Campus AI <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="nav-active"
                  onClick={() => navigate("Home")}
                >
                  College Directory
                </button>
                <button
                  onClick={() => setShowRegisterCollegeModal(true)}
                >
                  Register College
                </button>
                <button
                  className="nav-ai-button"
                  onClick={() => navigate("Admin")}
                >
                  <ShieldCheck size={17} /> Administrative Console
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* VIEW: HOME (EITHER DIRECTORY OR COLLEGE PORTAL) */}
      {page === "Home" && (
        <>
          {/* Hero Banner */}
          <section
            className="hero"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(5,25,46,.93), rgba(5,25,46,.70) 52%, rgba(5,25,46,.25)), url("${campusHeroImg}")`,
            }}
          >
            <div className="container hero-inner">
              <div className="hero-copy">
                <p className="eyebrow eyebrow-gold">
                  {selectedCollege
                    ? selectedCollege.code + " STUDENT PLATFORM"
                    : "ACADEMIC EXCELLENCE & AI INTELLIGENCE"}
                </p>

                <h1>
                  {selectedCollege ? (
                    <>
                      {selectedCollege.name}.
                      <br />
                      <span>Empowering Future Innovators.</span>
                    </>
                  ) : (
                    <>
                      One Connected Platform.
                      <br />
                      <span>Every Campus.</span>
                    </>
                  )}
                </h1>

                <p className="hero-description">
                  {selectedCollege
                    ? selectedCollege.description ||
                      "Access college notices, course resources, and get instant answers from your campus AI companion."
                    : "Discover your college portal, read official announcements, browse FAQs, and get assistance from CampusConnect AI."}
                </p>

                <div className="hero-actions">
                  {selectedCollege ? (
                    <>
                      <button
                        className="button button-gold"
                        onClick={() => navigate("Ask AI")}
                      >
                        <Bot size={18} /> Ask Campus AI <ArrowRight size={16} />
                      </button>

                      {!studentUser && (
                        <button
                          className="button button-outline"
                          onClick={() => {
                            setAuthMode("login");
                            setShowAuthModal(true);
                          }}
                        >
                          <LogIn size={16} /> Student Sign In
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      className="button button-gold"
                      onClick={() => {
                        const el = document.getElementById("directory-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Building2 size={18} /> Browse Colleges <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="hero-highlight">
                <span className="highlight-icon">
                  <GraduationCap size={30} />
                </span>
                <strong>
                  {selectedCollege
                    ? selectedCollege.name
                    : "Multi-Campus Platform"}
                </strong>
                <p>
                  {selectedCollege
                    ? `${selectedCollege.location?.city || "Campus"}, ${selectedCollege.location?.state || ""}`
                    : "Isolated institutional data, personalized portals, and scoped AI models."}
                </p>
              </div>
            </div>

            <div className="hero-bottom">
              <div className="container hero-bottom-inner">
                <span>INSTITUTIONAL DIRECTORY</span>
                <span>SCOPED AI HELPDESK</span>
                <span>AUTHENTICATED ACCESS</span>
              </div>
            </div>
          </section>

          {/* IF NO COLLEGE SELECTED: RENDER CENTRAL COLLEGE DIRECTORY */}
          {!selectedCollege && (
            <section
              id="directory-section"
              className="college-directory-section"
            >
              <div className="container">
                <div className="directory-heading">
                  <p className="eyebrow">CAMPUSCONNECT NETWORK</p>
                  <h2>Select Your College Portal</h2>
                  <p>
                    Choose your university or institute below to access your
                    college-specific portal, notices, student accounts, and AI
                    companion.
                  </p>
                </div>

                <div className="directory-search-bar">
                  <Search size={18} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Search by college name, city, state, or code (e.g. AIT, Bangalore, Metro)..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                  />
                  {directorySearch && (
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => setDirectorySearch("")}
                    >
                      <X size={16} color="#64748b" />
                    </button>
                  )}
                </div>

                {collegesLoading ? (
                  <div className="loading-panel">
                    <LoaderCircle className="spin" size={24} />
                    Loading participating colleges...
                  </div>
                ) : (
                  <div className="colleges-grid">
                    {colleges
                      .filter(
                        (col) =>
                          !directorySearch ||
                          col.name
                            ?.toLowerCase()
                            .includes(directorySearch.toLowerCase()) ||
                          col.code
                            ?.toLowerCase()
                            .includes(directorySearch.toLowerCase()) ||
                          col.location?.city
                            ?.toLowerCase()
                            .includes(directorySearch.toLowerCase()) ||
                          col.location?.state
                            ?.toLowerCase()
                            .includes(directorySearch.toLowerCase())
                      )
                      .map((col) => (
                        <div key={col._id} className="college-card">
                          <div>
                            <div className="college-card-top">
                              <span className="college-code-badge">
                                {col.code || "COLLEGE"}
                              </span>
                              <span className="college-location-tag">
                                <MapPin size={13} />{" "}
                                {col.location?.city
                                  ? `${col.location.city}, ${col.location.state || col.location.country}`
                                  : "Campus"}
                              </span>
                            </div>

                            <h3>{col.name}</h3>
                            <p className="college-tagline">{col.tagline}</p>
                            <p className="college-desc">
                              {col.description ||
                                "Accredited institution providing specialized learning and student services."}
                            </p>
                          </div>

                          <div className="college-card-actions">
                            <button
                              className="btn-college-enter"
                              onClick={() => handleSelectCollege(col)}
                            >
                              Enter Campus Portal <ChevronRight size={15} />
                            </button>
                            <button
                              className="btn-college-login"
                              onClick={() => {
                                handleSelectCollege(col);
                                setShowAuthModal(true);
                              }}
                            >
                              Sign In
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Institution Registration Callout Box */}
                <div className="register-college-box">
                  <div>
                    <h3>Are you an academic institution leader?</h3>
                    <p>
                      Join CampusConnectAI to give your students an automated AI
                      helpdesk, official notice circulars, and departmental
                      portals under your institution&apos;s branding.
                    </p>
                  </div>
                  <button
                    className="btn-gold-onboard"
                    onClick={() => setShowRegisterCollegeModal(true)}
                  >
                    <PlusCircle size={17} /> Register Your College
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* IF COLLEGE IS SELECTED: RENDER COLLEGE-SPECIFIC PORTAL SECTIONS */}
          {selectedCollege && (
            <>
              {/* Quick Links */}
              <section className="container quick-links">
                {[
                  {
                    title: "Ask Campus AI",
                    description: `Get answers from ${selectedCollege.code} FAQs and documents.`,
                    icon: Bot,
                    page: "Ask AI",
                  },
                  {
                    title: "College Notices",
                    description: `Official announcements for ${selectedCollege.name}.`,
                    icon: Bell,
                    page: "Notices",
                  },
                  {
                    title: "Student FAQs",
                    description: "Academics, exams, schedules, and services.",
                    icon: CircleHelp,
                    page: "FAQs",
                  },
                ].map(({ title, description, icon: Icon, page: target }) => (
                  <button
                    className="quick-link"
                    key={title}
                    onClick={() => navigate(target)}
                  >
                    <span className="quick-icon">
                      <Icon size={25} />
                    </span>
                    <span className="quick-copy">
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                    <ArrowRight className="quick-arrow" size={18} />
                  </button>
                ))}
              </section>

              {/* College Notices Preview */}
              <section className="container home-notices">
                <div className="home-notices-heading">
                  <div>
                    <p className="eyebrow">{selectedCollege.code} UPDATES</p>
                    <h2>Official College Notices</h2>
                    <p>
                      Stay informed with the latest notifications published by{" "}
                      {selectedCollege.name}.
                    </p>
                  </div>

                  <button
                    className="button button-navy"
                    onClick={() => navigate("Notices")}
                  >
                    View All Notices <ArrowRight size={16} />
                  </button>
                </div>

                {notices.length > 0 ? (
                  <div className="home-notices-grid">
                    {notices.slice(0, 3).map((notice, index) => (
                      <article
                        className="home-notice-card"
                        key={notice._id || index}
                      >
                        <span className="home-notice-icon">
                          <Bell size={22} />
                        </span>
                        <small>{notice.category || "College Notice"}</small>
                        <h3>{notice.title}</h3>
                        <p>{notice.content}</p>
                        {notice.publishedAt && (
                          <time>
                            {new Date(notice.publishedAt).toLocaleDateString()}
                          </time>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="home-notices-empty">
                    <Bell size={24} />
                    <p>No notices currently active for {selectedCollege.name}.</p>
                  </div>
                )}
              </section>

              {/* Academic Highlights */}
              <section className="container departments-section">
                <div className="departments-heading">
                  <p className="eyebrow">ACADEMIC RESOURCES</p>
                  <h2>Explore Campus Programs & Labs</h2>
                  <p>
                    Discover research facilities, technical infrastructure, and
                    student support.
                  </p>
                </div>

                <div className="departments-grid">
                  {[
                    {
                      icon: GraduationCap,
                      title: "Academic Curriculum",
                      description:
                        "Syllabus guides, course outlines, and academic advisor contacts.",
                    },
                    {
                      icon: BookOpen,
                      title: "Department Resources",
                      description:
                        "Course schedules, lab assignments, and project archives.",
                    },
                    {
                      icon: FlaskConical,
                      title: "Research & Labs",
                      description:
                        "Access practical workshops, testing labs, and student incubators.",
                    },
                    {
                      icon: Library,
                      title: "Campus Library",
                      description:
                        "Central catalog, reserve books, study spaces, and e-journals.",
                    },
                  ].map(({ icon: Icon, title, description }) => (
                    <article className="department-card" key={title}>
                      <span className="department-icon">
                        <Icon size={26} />
                      </span>
                      <h3>{title}</h3>
                      <p>{description}</p>
                      <button
                        className="simple-link"
                        onClick={() => navigate("Academics")}
                      >
                        Explore resources <ArrowRight size={15} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}

      {/* VIEW: ASK AI (SCOPED TO SELECTED COLLEGE) */}
      {page === "Ask AI" && (
        <main className="container inner-page chat-page">
          <p className="eyebrow">
            {selectedCollege
              ? `${selectedCollege.name.toUpperCase()} INTELLIGENCE`
              : "CAMPUSCONNECT INTELLIGENCE"}
          </p>
          <h1>How can we help you?</h1>
          <p className="inner-intro">
            {selectedCollege
              ? `Ask questions about ${selectedCollege.name} exams, academics, notices, and facilities.`
              : "Ask general campus questions or select a specific college to query official institutional guidelines."}
          </p>

          <div className="chat-box">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <span className="chat-bot">
                  <Bot size={36} />
                </span>

                <h2>
                  Hello! Welcome to{" "}
                  {selectedCollege ? `${selectedCollege.name} AI` : "Campus AI"}.
                </h2>
                <p>Choose a suggested question or type your own below.</p>

                <div className="suggestions">
                  {[
                    "When are semester examinations conducted?",
                    "How can I check college notices?",
                    "Where can I get academic information?",
                    "What are the campus library timings?",
                  ].map((q) => (
                    <button key={q} onClick={() => askAI(q)}>
                      {q} <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div
                    className={`chat-message ${
                      message.role === "user" ? "from-user" : "from-ai"
                    }`}
                    key={index}
                  >
                    <div className="message-avatar">
                      {message.role === "user" ? "S" : <Bot size={19} />}
                    </div>

                    <div className="message-content">
                      <strong>
                        {message.role === "user"
                          ? "You"
                          : selectedCollege
                          ? `${selectedCollege.code} AI Assistant`
                          : "CampusConnect AI"}
                      </strong>

                      <p className={message.error ? "message-error" : ""}>
                        {message.text}
                      </p>

                      {message.sources?.length > 0 && (
                        <div className="source-box">
                          <strong>
                            <BookOpen size={16} /> Verified sources from{" "}
                            {selectedCollege ? selectedCollege.name : "College"} FAQs
                          </strong>

                          {message.sources.map((source, i) => (
                            <div className="source-item" key={i}>
                              <span>✓</span>
                              <div>
                                {source.question || source.name}
                                {source.category && (
                                  <small>{source.category}</small>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.mode === "faq_fallback" && (
                        <small className="fallback-note">
                          Answer retrieved directly from available college FAQ.
                        </small>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="chat-message from-ai">
                    <div className="message-avatar">
                      <Bot size={19} />
                    </div>
                    <div className="message-content">
                      <strong>CampusConnect AI</strong>
                      <div className="typing-row">
                        <span />
                        <span />
                        <span />
                        <small>Searching college resources...</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form
              className="chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                askAI();
              }}
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  selectedCollege
                    ? `Ask anything about ${selectedCollege.name}...`
                    : "Type your college question here..."
                }
                maxLength={1000}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || !question.trim()}
                aria-label="Send question"
              >
                {loading ? (
                  <LoaderCircle className="spin" size={21} />
                ) : (
                  <ArrowRight size={21} />
                )}
              </button>
            </form>
          </div>

          <p className="chat-note">
            <ShieldCheck size={16} />
            Institutional AI answers are grounded in official documents and
            curated college FAQs.
          </p>
        </main>
      )}

      {/* VIEW: NOTICES OR FAQS */}
      {(page === "Notices" || page === "FAQs") && (
        <main className="container inner-page">
          <p className="eyebrow">
            {selectedCollege ? selectedCollege.name.toUpperCase() : "STUDENT RESOURCES"}
          </p>
          <h1>
            {page === "Notices"
              ? "College Notices & Circulars"
              : "Frequently Asked Questions"}
          </h1>
          <p className="inner-intro">
            {page === "Notices"
              ? `Stay informed about academic notifications, exams, and announcements for ${
                  selectedCollege?.name || "your institution"
                }.`
              : `Find verified answers from ${
                  selectedCollege?.name || "college"
                } administration.`}
          </p>

          {dataLoading ? (
            <div className="loading-panel">
              <LoaderCircle className="spin" size={23} />
              Loading {page.toLowerCase()}...
            </div>
          ) : dataError ? (
            <div className="empty-state">
              <CircleHelp size={35} />
              <h3>Could not load {page.toLowerCase()}</h3>
              <p>{dataError}</p>
              <button
                className="button button-navy"
                onClick={() => loadResources()}
              >
                Try again
              </button>
            </div>
          ) : (
            renderResources(page === "Notices" ? notices : faqs, page)
          )}
        </main>
      )}

      {/* VIEW: ACADEMICS & CAMPUS LIFE */}
      {page !== "Home" &&
        page !== "Ask AI" &&
        page !== "Notices" &&
        page !== "FAQs" && (
          <main className="container inner-page">
            <p className="eyebrow">
              {selectedCollege ? selectedCollege.name : "CAMPUSCONNECTAI"}
            </p>
            <h1>{page}</h1>
            <p className="inner-intro">
              Explore resources, student support, and academic facilities
              conveniently from one portal.
            </p>

            <div className="resource-grid">
              {programs.map(({ title, description, image, icon: Icon }) => (
                <article className="resource-card" key={title}>
                  <img className="inner-card-image" src={image} alt={title} />
                  <span className="resource-icon">
                    <Icon size={23} />
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <button
                    className="simple-link"
                    onClick={() => navigate("Ask AI")}
                  >
                    Ask Campus AI <ArrowRight size={15} />
                  </button>
                </article>
              ))}
            </div>
          </main>
        )}

      {/* STUDENT AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowAuthModal(false)}
            >
              <X size={20} />
            </button>

            <div className="modal-header">
              <span className="modal-college-tag">
                {selectedCollege ? selectedCollege.name : "Select College"}
              </span>
              <h3>
                {authMode === "login"
                  ? "Student Portal Sign In"
                  : "Student Enrollment Registration"}
              </h3>
            </div>

            <div className="modal-tab-bar">
              <button
                className={`modal-tab-btn ${
                  authMode === "login" ? "active" : ""
                }`}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Sign In
              </button>
              <button
                className={`modal-tab-btn ${
                  authMode === "register" ? "active" : ""
                }`}
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
              >
                New Registration
              </button>
            </div>

            {authError && <div className="alert alert-error">{authError}</div>}
            {authSuccess && (
              <div className="alert alert-success">{authSuccess}</div>
            )}

            <form className="modal-form" onSubmit={handleStudentAuth}>
              {authMode === "register" && (
                <>
                  <div>
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Sharma"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label>College Roll / Registration Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS2026-042"
                      value={authRollNumber}
                      onChange={(e) => setAuthRollNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label>Department / Major</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science & Engineering"
                      value={authDepartment}
                      onChange={(e) => setAuthDepartment(e.target.value)}
                    />
                  </div>

                  <div>
                    <label>Academic Year</label>
                    <select
                      value={authYear}
                      onChange={(e) => setAuthYear(e.target.value)}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>

              <div>
                <label>Password (min 8 characters)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="modal-submit-btn"
                disabled={authLoading}
              >
                {authLoading
                  ? "Authenticating..."
                  : authMode === "login"
                  ? "Access Student Portal"
                  : "Complete Registration"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INSTITUTION ONBOARDING REGISTRATION MODAL */}
      {showRegisterCollegeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRegisterCollegeModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowRegisterCollegeModal(false)}
            >
              <X size={20} />
            </button>

            <div className="modal-header">
              <Building2
                size={30}
                color="#d4af37"
                style={{ margin: "0 auto 8px" }}
              />
              <h3>Register Your Institution</h3>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
                Submit your college details to establish your dedicated portal on
                CampusConnectAI.
              </p>
            </div>

            {regColMsg && (
              <div
                className={`alert ${
                  regColMsg.startsWith("Error") ? "alert-error" : "alert-success"
                }`}
              >
                {regColMsg}
              </div>
            )}

            <form className="modal-form" onSubmit={handleRegisterCollege}>
              <div>
                <label>Official College Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Institute of Technology"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label>College Code (3-6 chars)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RIT"
                    value={newColCode}
                    onChange={(e) => setNewColCode(e.target.value)}
                  />
                </div>
                <div>
                  <label>City / Campus Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={newColCity}
                    onChange={(e) => setNewColCity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label>Official Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="registrar@rit.edu"
                  value={newColEmail}
                  onChange={(e) => setNewColEmail(e.target.value)}
                />
              </div>

              <div>
                <label>Short Description / Mission</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of engineering programs and campus facilities..."
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="modal-submit-btn"
                disabled={regColLoading}
              >
                {regColLoading ? "Submitting..." : "Submit College Application"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-about">
            <button
              className="brand footer-brand"
              onClick={() => {
                setSelectedCollege(null);
                navigate("Home");
              }}
            >
              <span className="brand-mark">
                <GraduationCap size={28} />
              </span>
              <span>
                <strong>
                  CampusConnect<span className="brand-ai">AI</span>
                </strong>
                <small>MULTI-COLLEGE PLATFORM</small>
              </span>
            </button>
            <p>
              A unified campus companion delivering isolated institutional
              portals, automated student helpdesk, and college notices.
            </p>
          </div>

          <div className="footer-column">
            <strong>PARTICIPATING COLLEGES</strong>
            {colleges.slice(0, 4).map((c) => (
              <button key={c._id} onClick={() => handleSelectCollege(c)}>
                {c.name}
              </button>
            ))}
          </div>

          <div className="footer-column">
            <strong>PORTAL ACCESS</strong>
            <button onClick={() => navigate("Home")}>Colleges Directory</button>
            <button onClick={() => setShowRegisterCollegeModal(true)}>
              Register an Institution
            </button>
            <button onClick={() => navigate("Admin")}>Admin Portal</button>
          </div>

          <div className="footer-column">
            <strong>NEED ASSISTANCE?</strong>
            <p>Have campus questions? Ask your College AI Companion.</p>
            <button className="footer-ask" onClick={() => navigate("Ask AI")}>
              <MessageCircle size={15} /> Ask Campus AI <ExternalLink size={13} />
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <span>© 2026 CampusConnectAI. All rights reserved.</span>
            <span>
              Multi-Tenant Architecture · Verified Institutional Isolation · AI Powered
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
