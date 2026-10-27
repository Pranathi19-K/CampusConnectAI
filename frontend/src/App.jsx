import { useEffect, useState } from "react";
import {
  GraduationCap,
  Bot,
  ArrowRight,
  BookOpen,
  Bell,
  Users,
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
} from "lucide-react";
import "./App.css";
import AdminDashboard from "./pages/AdminDashboard";

const API = "http://localhost:5000/api";

const campusImage =
  "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2000&q=90";

const programs = [
  {
    title: "Academic Resources",
    description: "Find academic information and learning resources.",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=85",
    icon: BookOpen,
  },
  {
    title: "Campus Library",
    description: "Discover learning spaces and library resources.",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=85",
    icon: Library,
  },
  {
    title: "Labs & Innovation",
    description: "Explore practical learning and innovation.",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=85",
    icon: FlaskConical,
  },
];

const quickLinks = [
  {
    title: "Ask Campus AI",
    description: "Get answers to college questions.",
    icon: Bot,
    page: "Ask AI",
  },
  {
    title: "College Notices",
    description: "Read important announcements.",
    icon: Bell,
    page: "Notices",
  },
  {
    title: "Student FAQs",
    description: "Find answers to common questions.",
    icon: CircleHelp,
    page: "FAQs",
  },
];

function App() {
  const [page, setPage] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [notices, setNotices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (page !== "Home" && page !== "Notices" && page !== "FAQs") return;

    let cancelled = false;

    async function loadResources() {
      setDataLoading(true);
      setDataError("");

      try {
        const endpoint =
  page === "FAQs" ? `${API}/faqs` : `${API}/notices`;

        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load information.");
        }

        const list = Array.isArray(data)
          ? data
          : data.notices || data.faqs || data.data || data.items || [];

        if (!Array.isArray(list)) {
          throw new Error("Unexpected response from the server.");
        }

        if (!cancelled) {
          if (page === "Notices") {
            setNotices(list);
          } else {
            setFaqs(list);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setDataError(
            error.message ||
              "Backend is unavailable. Please start the backend server."
          );
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    loadResources();

    return () => {
      cancelled = true;
    };
  }, [page]);

  async function askAI(text = question) {
    const prompt = text.trim();

    if (!prompt || loading) return;

    setQuestion("");
    setPage("Ask AI");
    setMessages((old) => [...old, { role: "user", text: prompt }]);
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt }),
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
            "Unable to connect. Please check that the backend is running.",
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const renderResources = (items, type) => {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          {type === "Notices" ? <Bell size={35} /> : <CircleHelp size={35} />}
          <h3>No {type.toLowerCase()} available</h3>
          <p>College information will appear here when it is available.</p>
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
              {item.title || item.question || item.name || "College resource"}
            </h3>

            <p>
              {item.content ||
                item.description ||
                item.answer ||
                "More information is available through college administration."}
            </p>

            {item.createdAt && (
              <time>
                {new Date(item.createdAt).toLocaleDateString()}
              </time>
            )}
          </article>
        ))}
      </div>
    );
  };

  if (page === "Admin") {
    return <AdminDashboard />;
  }

  return (
    <div className="campus-app">
      <div className="utility-bar">
        <div className="container utility-inner">
          <span>
            <Landmark size={15} /> CampusConnectAI
            <span className="utility-divider">|</span> Student Portal
          </span>

          <div className="utility-links">
            <button onClick={() => navigate("FAQs")}>Student Resources</button>
            <button onClick={() => navigate("Notices")}>Notices</button>
            <button onClick={() => navigate("Ask AI")}>Helpdesk</button>
            <button onClick={() => navigate("Admin")}>Admin Login</button>
          </div>
        </div>
      </div>

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
                CampusConnect<span className="brand-ai">AI</span>
              </strong>
              <small>YOUR CAMPUS COMPANION</small>
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

            <button className="nav-ai-button" onClick={() => navigate("Ask AI")}>
              <Bot size={17} /> Ask Campus AI <ArrowRight size={15} />
            </button>
          </nav>
        </div>
      </header>

      {page === "Home" && (
        <>
          <section
            className="hero"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(5,25,46,.91), rgba(5,25,46,.67) 52%, rgba(5,25,46,.15)), url("${campusImage}")`,
            }}
          >
            <div className="container hero-inner">
              <div className="hero-copy">
                <p className="eyebrow eyebrow-gold">
                  LEARNING TODAY. LEADING TOMORROW.
                </p>

                <h1>
                  A Smarter Campus.
                  <br />
                  <span>A Brighter Future.</span>
                </h1>

                <p className="hero-description">
                  Discover college resources, read important notices, and get
                  answers to your campus questions — all in one place.
                </p>

                <div className="hero-actions">
                  <button
                    className="button button-gold"
                    onClick={() => navigate("Ask AI")}
                  >
                    <Bot size={18} /> Ask Campus AI <ArrowRight size={16} />
                  </button>

                  <button
                    className="button button-outline"
                    onClick={() => navigate("Campus Life")}
                  >
                    Explore Campus <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="hero-highlight">
                <span className="highlight-icon">
                  <GraduationCap size={30} />
                </span>
                <strong>
                  Your campus.
                  <br />
                  All connected.
                </strong>
                <p>Answers, notices and student resources in one place.</p>
              </div>
            </div>

            <div className="hero-bottom">
              <div className="container hero-bottom-inner">
                <span>STUDENT SUPPORT</span>
                <span>ACADEMIC RESOURCES</span>
                <span>CAMPUS INFORMATION</span>
              </div>
            </div>
          </section>

          <section className="container quick-links">
            {quickLinks.map(({ title, description, icon: Icon, page: target }) => (
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
          
<section className="container home-notices">
  <div className="home-notices-heading">
    <div>
      <p className="eyebrow">STAY UPDATED</p>
      <h2>Latest College Notices</h2>
      <p>Important announcements and campus updates.</p>
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
          key={notice._id || notice.id || index}
        >
          <span className="home-notice-icon">
            <Bell size={22} />
          </span>

          <small>{notice.category || "College Announcement"}</small>

          <h3>{notice.title || "College Notice"}</h3>

          <p>
            {notice.content ||
              notice.description ||
              "Please check the full notice for more information."}
          </p>

          {notice.createdAt && (
            <time>
              {new Date(notice.createdAt).toLocaleDateString("en-IN")}
            </time>
          )}
        </article>
      ))}
    </div>
  ) : (
    <div className="home-notices-empty">
      <Bell size={24} />
      <p>
        {dataError
          ? "Notices are temporarily unavailable."
          : "No college notices have been published yet."}
      </p>
      <button
        className="simple-link"
        onClick={() => navigate("Notices")}
      >
        Open Notices <ArrowRight size={15} />
      </button>
    </div>
  )}
</section>

<section className="container departments-section">
  <div className="departments-heading">
    <p className="eyebrow">ACADEMIC EXCELLENCE</p>
    <h2>Explore Our Academic Areas</h2>
    <p>
      Discover learning resources, practical labs and opportunities
      to build your future.
    </p>
  </div>

  <div className="departments-grid">
    {[
      {
        icon: GraduationCap,
        title: "Engineering & Technology",
        description:
          "Explore engineering concepts, technical learning and practical skills.",
      },
      {
        icon: BookOpen,
        title: "Computer Science",
        description:
          "Discover programming, software development and emerging technologies.",
      },
      {
        icon: FlaskConical,
        title: "Research & Innovation",
        description:
          "Learn through experiments, projects and innovative ideas.",
      },
      {
        icon: Library,
        title: "Library & Learning",
        description:
          "Access study resources and support your academic journey.",
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



          <section className="container campus-section">
            <div className="section-intro">
              <p className="eyebrow">EXPLORE YOUR CAMPUS</p>
              <h2>
                Discover. Learn.
                <br />
                <span>Achieve more.</span>
              </h2>
              <span className="gold-rule" />
              <p>
                Find learning resources, explore campus facilities, and make
                the most of your college journey.
              </p>

              <button
                className="button button-navy"
                onClick={() => navigate("Academics")}
              >
                Explore Resources <ArrowRight size={16} />
              </button>
            </div>

            <div className="program-grid">
              {programs.map(({ title, description, image, icon: Icon }, i) => (
                <button
                  className="program-card"
                  key={title}
                  onClick={() =>
                    navigate(i === 0 ? "Academics" : "Campus Life")
                  }
                >
                  <img src={image} alt={title} loading="lazy" />

                  <span className="program-number">0{i + 1}</span>

                  <span className="program-overlay">
                    <Icon size={22} />
                    <strong>{title}</strong>
                    <small>{description}</small>
                    <span className="learn-more">
                      Explore <ArrowRight size={14} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="stats-band">
            <div className="container stats-grid">
              <div>
                <GraduationCap size={27} />
                <strong>Student-first</strong>
                <span>Campus support</span>
              </div>

              <div>
                <BookOpen size={27} />
                <strong>Academic</strong>
                <span>Learning resources</span>
              </div>

              <div>
                <Users size={27} />
                <strong>Connected</strong>
                <span>Student services</span>
              </div>

              <div>
                <Bot size={27} />
                <strong>AI-powered</strong>
                <span>Smart helpdesk</span>
              </div>
            </div>
          </section>

          <section className="container updates-section">
            <div className="updates-heading">
              <p className="eyebrow">CAMPUSCONNECTAI</p>
              <h2>Make campus life easier.</h2>
              <p>
                Access useful information and get help whenever you need it.
              </p>
            </div>

            <div className="updates-grid">
              <article className="update-card">
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=850&q=85"
                  alt="University campus"
                  loading="lazy"
                />
                <div className="update-body">
                  <span>CAMPUS LIFE</span>
                  <h3>A place to learn and grow</h3>
                  <p>
                    Explore campus resources and discover opportunities to make
                    your college journey better.
                  </p>
                  <button onClick={() => navigate("Campus Life")}>
                    Explore campus <ArrowRight size={15} />
                  </button>
                </div>
              </article>

              <article className="update-card">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=850&q=85"
                  alt="Students using technology"
                  loading="lazy"
                />
                <div className="update-body">
                  <span>SMART HELP</span>
                  <h3>Meet your Campus AI assistant</h3>
                  <p>
                    Ask questions and get answers based on the available
                    college FAQs.
                  </p>
                  <button onClick={() => navigate("Ask AI")}>
                    Ask Campus AI <ArrowRight size={15} />
                  </button>
                </div>
              </article>
            </div>
          </section>
        </>
      )}

      {page === "Ask AI" && (
        <main className="container inner-page chat-page">
          <p className="eyebrow">CAMPUSCONNECT INTELLIGENCE</p>
          <h1>How can we help you?</h1>
          <p className="inner-intro">
            Ask about college academics, examinations, notices and campus
            services.
          </p>

          <div className="chat-box">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <span className="chat-bot">
                  <Bot size={36} />
                </span>

                <h2>Hello! Welcome to Campus AI.</h2>
                <p>Choose a suggested question or type your own below.</p>

                <div className="suggestions">
                  {[
                    "When are semester examinations conducted?",
                    "How can I check college notices?",
                    "Where can I get academic information?",
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
                        {message.role === "user" ? "You" : "CampusConnect AI"}
                      </strong>

                      <p className={message.error ? "message-error" : ""}>
                        {message.text}
                      </p>

                      {message.sources?.length > 0 && (
                        <div className="source-box">
                          <strong>
                            <BookOpen size={16} /> Sources from college FAQs
                          </strong>

                          {message.sources.map((source, i) => (
                            <div className="source-item" key={i}>
                              <span>✓</span>
                              <div>
                                {source.question}
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
                          Answer retrieved directly from the available FAQ.
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
                placeholder="Type your college question here..."
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
            Verify important dates and official information with college
            administration.
          </p>
        </main>
      )}

      {(page === "Notices" || page === "FAQs") && (
        <main className="container inner-page">
          <p className="eyebrow">STUDENT RESOURCE CENTER</p>
          <h1>
            {page === "Notices"
              ? "College Notices"
              : "Frequently Asked Questions"}
          </h1>
          <p className="inner-intro">
            {page === "Notices"
              ? "Stay informed about college announcements and updates."
              : "Find answers to common questions from available college FAQs."}
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
                onClick={() => setPage(page)}
              >
                Try again
              </button>
            </div>
          ) : (
            renderResources(page === "Notices" ? notices : faqs, page)
          )}
        </main>
      )}

      {page !== "Home" && page !== "Ask AI" &&
        page !== "Notices" && page !== "FAQs" && (
          <main className="container inner-page">
            <p className="eyebrow">CAMPUSCONNECTAI</p>
            <h1>{page}</h1>
            <p className="inner-intro">
              Explore campus resources, student support and academic
              information from one convenient place.
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

            <button
              className="button button-gold"
              onClick={() => navigate("Ask AI")}
            >
              <Bot size={17} /> Ask Campus AI
            </button>
          </main>
        )}

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-about">
            <button className="brand footer-brand" onClick={() => navigate("Home")}>
              <span className="brand-mark">
                <GraduationCap size={28} />
              </span>
              <span>
                <strong>
                  CampusConnect<span className="brand-ai">AI</span>
                </strong>
                <small>YOUR CAMPUS COMPANION</small>
              </span>
            </button>

            <p>
              A smarter way to discover campus information, student resources
              and college updates.
            </p>
          </div>

          <div className="footer-column">
            <strong>QUICK LINKS</strong>
            <button onClick={() => navigate("Home")}>Home</button>
            <button onClick={() => navigate("Academics")}>Academics</button>
            <button onClick={() => navigate("Notices")}>Notices</button>
          </div>

          <div className="footer-column">
            <strong>STUDENT RESOURCES</strong>
            <button onClick={() => navigate("FAQs")}>FAQs</button>
            <button onClick={() => navigate("Campus Life")}>Campus Life</button>
            <button onClick={() => navigate("Ask AI")}>Helpdesk</button>
          </div>

          <div className="footer-column">
            <strong>NEED HELP?</strong>
            <p>Have a college question? Ask your Campus AI assistant.</p>
            <button className="footer-ask" onClick={() => navigate("Ask AI")}>
              <MessageCircle size={15} /> Ask Campus AI <ExternalLink size={13} />
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <span>
              © {new Date().getFullYear()} CampusConnectAI. All rights reserved.
            </span>
            <span>Student helpdesk · Academic resources · Campus information</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
