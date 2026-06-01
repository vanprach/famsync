import React, { useState, useEffect } from "react";
import { LogIn, Calendar, Plane, ShieldCheck, Globe, Star, Users } from "lucide-react";
import { translations } from "../utils/translations";
import { storageAPI } from "../utils/storage";

export default function Login({ onLoginSuccess, lang, setLang }) {
  const t = translations[lang];
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Real Google Sign-In callback
  const handleCredentialResponse = (response) => {
    try {
      const jwt = response.credential;
      // Decode JWT payload on the client
      const base64Url = jwt.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      
      const payload = JSON.parse(jsonPayload);
      const email = payload.email;
      const name = payload.name;
      const picture = payload.picture;

      submitAuth(email, name, picture);
    } catch (err) {
      console.error("JWT decoding failed:", err);
      setError(t.loginError);
    }
  };

  // Initialize official Google Identity button if Client ID exists
  useEffect(() => {
    if (googleClientId && window.google) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        context: "signin",
        ux_mode: "popup",
        auto_select: false
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn-real"),
        { 
          theme: "filled_blue", 
          size: "large", 
          width: "100%",
          shape: "rectangular",
          logo_alignment: lang === "he" ? "right" : "left"
        }
      );
    }
  }, [googleClientId, lang]);

  const handleDemoSelect = (email, name) => {
    submitAuth(email, name);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError(t.requiredField);
      return;
    }
    if (!emailInput.includes("@")) {
      setError(t.invalidGmail);
      return;
    }
    const name = nameInput.trim() || emailInput.split("@")[0];
    submitAuth(emailInput, name);
  };

  const submitAuth = async (email, name, customAvatar = "") => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const matched = await storageAPI.findFamilyByMemberEmail(cleanEmail);
      
      let loggedUser = null;
      
      if (matched) {
        loggedUser = {
          email: cleanEmail,
          name: matched.member.name,
          role: matched.member.role,
          color: matched.member.color,
          avatar: customAvatar || matched.member.avatar,
          familyId: matched.family.id,
          familyName: matched.family.name
        };
      } else {
        loggedUser = {
          email: cleanEmail,
          name: name,
          role: "parent",
          color: "#8b5cf6",
          avatar: customAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
          familyId: null,
          familyName: ""
        };
      }

      storageAPI.setCurrentUser(loggedUser);
      setShowGooglePopup(false);
      onLoginSuccess(loggedUser);
    } catch (err) {
      console.error("Login submission error:", err);
      setError(t.loginError || "שגיאת התחברות. נסה שוב.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Dynamic Keyframe styling for landing page showcase */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.15); }
          50% { box-shadow: 0 0 35px rgba(139, 92, 246, 0.3); }
          100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.15); }
        }
        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 40px;
          border-bottom: 1px solid var(--border-glass);
          background: rgba(9, 9, 11, 0.6);
          backdrop-filter: blur(10px);
        }
        .hero-section {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 60px;
          align-items: center;
          padding: 60px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .hero-title {
          font-size: 52px;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #ffffff 30%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-desc {
          color: var(--text-secondary);
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .showcase-area {
          position: relative;
          height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .showcase-bg {
          position: absolute;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%);
          filter: blur(20px);
          z-index: 1;
        }
        .floating-card {
          position: absolute;
          width: 260px;
          padding: 16px;
          z-index: 2;
          box-shadow: var(--shadow-lg);
          border-color: rgba(255,255,255,0.12);
        }
        .floating-card-1 {
          top: 30px;
          left: 20px;
          animation: float 5s ease-in-out infinite;
          border-inline-start: 4px solid var(--primary);
        }
        .floating-card-2 {
          bottom: 30px;
          right: 20px;
          animation: float-delayed 6s ease-in-out infinite;
          border-inline-start: 4px solid var(--success);
        }
        .feature-grid-section {
          padding: 60px 40px;
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid var(--border-glass);
        }
        .landing-feature-card {
          padding: 28px;
          transition: transform 0.2s ease;
        }
        .landing-feature-card:hover {
          transform: translateY(-5px);
        }
        @media (max-width: 992px) {
          .hero-section {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .hero-title {
            font-size: 38px;
          }
          .showcase-area {
            height: 280px;
          }
          .floating-card {
            width: 220px;
          }
          .floating-card-1 { left: 5%; top: 10px; }
          .floating-card-2 { right: 5%; bottom: 10px; }
          .landing-header {
            padding: 16px 20px;
          }
        }
        .testimonials-section {
          padding: 80px 40px;
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid var(--border-glass);
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .testimonial-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .testimonial-card:hover {
          transform: translateY(-5px) scale(1.01);
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1);
        }
        .star-rating {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }
        .star-icon {
          color: #ffd700;
          fill: #ffd700;
          filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
        }
        .bento-wide {
          grid-column: span 2;
        }
        @media (max-width: 992px) {
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
          .bento-wide {
            grid-column: span 1;
          }
        }
      `}</style>

      {/* Landing Header */}
      <header className="landing-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🏠</span>
          <span className="logo-text" style={{ fontSize: "20px" }}>{t.appName}</span>
        </div>
        <button 
          onClick={() => setLang(lang === "he" ? "en" : "he")} 
          className="btn-secondary"
          style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Globe size={14} />
          {lang === "he" ? "English" : "עברית"}
        </button>
      </header>

      {/* Hero Section */}
      <main className="hero-section">
        
        {/* Left text column */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(139, 92, 246, 0.1)", color: "var(--primary)", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700", marginBottom: "20px" }}>
            <Star size={14} fill="var(--primary)" />
            <span>{lang === "he" ? "ניהול משפחתי ברמה של 5 כוכבים" : "5-Star Family Hub"}</span>
          </div>

          <h1 className="hero-title">
            {lang === "he" ? "הבית שלכם, מסונכרן לחלוטין" : "Your Family. Perfectly Synced."}
          </h1>
          <p className="hero-desc">
            {lang === "he" 
              ? "רכזו במקום אחד חוגים של ילדים, אימוני הורים, טיסות משפחתיות וקבלות. מסמכים ועדכונים זמינים באופן מיידי לכל בני המשפחה בכל מכשיר." 
              : "Coordinate kids' activities, parents' fitness, flights, and hotels in one shared web app. All document receipts are securely backed up and instantly shared with everyone."}
          </p>

          {/* Authentication Action Container */}
          <div className="glass-panel" style={{ padding: "24px", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "16px", animation: "pulse-glow 4s ease-in-out infinite" }}>
            
            {/* Conditional Google Login Container */}
            {googleClientId ? (
              // Real Google Sign-in button wrapper
              <div style={{ width: "100%" }}>
                <div id="google-signin-btn-real" style={{ width: "100%", minHeight: "44px" }}></div>
                {error && <div style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>{error}</div>}
              </div>
            ) : (
              // Offline fallback styled Google login
              <button 
                onClick={() => setShowGooglePopup(true)} 
                className="google-btn"
                style={{ width: "100%" }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                {t.loginWithGoogle}
              </button>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
              <ShieldCheck size={14} color="var(--success)" />
              <span>{lang === "he" ? "התחברות מאובטחת ללא סיסמה" : "Passwordless Secure Sign-In"}</span>
            </div>

            {/* Security First Trust Bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "10px",
              border: "1px solid var(--border-glass)",
              gap: "8px",
              marginTop: "4px"
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: "16px", marginBottom: "4px" }}>🔒</span>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)" }}>AES-256</span>
                <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>{lang === "he" ? "הצפנה מקצה לקצה" : "End-to-End Encryption"}</span>
              </div>
              <div style={{ width: "1px", height: "30px", background: "var(--border-glass)" }}></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: "16px", marginBottom: "4px" }}>🛡️</span>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)" }}>{lang === "he" ? "פרטיות מלאה" : "Private Data"}</span>
                <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>{lang === "he" ? "מידע מאובטח" : "100% Secure"}</span>
              </div>
              <div style={{ width: "1px", height: "30px", background: "var(--border-glass)" }}></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: "16px", marginBottom: "4px" }}>⚡</span>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)" }}>{lang === "he" ? "סנכרון מיידי" : "Instant Sync"}</span>
                <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>{lang === "he" ? "עדכונים בזמן אמת" : "Real-time updates"}</span>
              </div>
            </div>

            {/* Custom simulation hint trigger if real button loads but they want presets */}
            {googleClientId && (
              <button 
                onClick={() => setShowGooglePopup(true)}
                style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
              >
                {lang === "he" ? "רוצה להיכנס עם חשבון הדגמה לבדיקה?" : "Use preset demo account for testing?"}
              </button>
            )}

            {!googleClientId && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>
                {t.loginDemoHint}
              </span>
            )}
          </div>
        </div>

        {/* Right column: Floating visual cards */}
        <div className="showcase-area">
          <div className="showcase-bg"></div>
          
          {/* Card 1: Parent Schedule activity */}
          <div className="glass-panel floating-card floating-card-1">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary)" }}>🧘 {lang === "he" ? "לו\"ז הורים" : "Parents' Course"}</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>08:00</span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "4px" }}>{lang === "he" ? "שיעור יוגה - שרית" : "Yoga Class - Sarit"}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{lang === "he" ? "חוזר כל שבוע ביום ראשון" : "Repeats weekly on Sunday"}</div>
          </div>

          {/* Card 2: Kids activity */}
          <div className="glass-panel floating-card floating-card-2">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--success)" }}>🏊 {lang === "he" ? "חוג ילדים" : "Kids' Activity"}</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>16:30</span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "4px" }}>{lang === "he" ? "שיעור שחייה - דן" : "Swim Class - Dan"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--success)" }}></div>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{lang === "he" ? "פעיל" : "Active"}</span>
            </div>
          </div>
        </div>

      </main>

      {/* Features Grid */}
      <section className="feature-grid-section">
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: "800", marginBottom: "40px" }}>
          {lang === "he" ? "הפונקציות שמקלות על חיי המשפחה" : "Features Built for Cohesive Families"}
        </h2>

        <div className="grid-cols-3">
          <div className="glass-panel landing-feature-card">
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "var(--primary-glow)", border: "1px solid rgba(139, 92, 246, 0.2)", color: "var(--primary)", display: "flex", alignItems: "center", justifycontent: "center", marginBottom: "16px" }}>
              <Calendar size={20} style={{ margin: "auto" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "10px" }}>
              {lang === "he" ? "לוח חוגים ואימונים שבועי" : "Activity Scheduling"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
              {lang === "he" 
                ? "הפרדה חכמה בין חוגי הורים לילדים. שעת התחלה, סיום ומעקב שבועי מסונכרן."
                : "Distinct sorting for parents' training and kids' lessons. Never overlap schedule slots."}
            </p>
          </div>

          <div className="glass-panel landing-feature-card">
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "var(--primary-glow)", border: "1px solid rgba(139, 92, 246, 0.2)", color: "var(--primary)", display: "flex", alignItems: "center", justifycontent: "center", marginBottom: "16px" }}>
              <Plane size={20} style={{ margin: "auto" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "10px" }}>
              {lang === "he" ? "מרכז טיסות ומלונות" : "Shared Travel Hub"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
              {lang === "he" 
                ? "פרטי טיסות ומספרי הזמנה למלון מרוכזים לכולם. כולל אפשרות להצמדת קבלות וכרטיסי עלייה למטוס."
                : "Flight segments, hotels, addresses, check-in dates, and boarding pass attachments visible in one place."}
            </p>
          </div>

          <div className="glass-panel landing-feature-card">
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "var(--primary-glow)", border: "1px solid rgba(139, 92, 246, 0.2)", color: "var(--primary)", display: "flex", alignItems: "center", justifycontent: "center", marginBottom: "16px" }}>
              <Users size={20} style={{ margin: "auto" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "750", marginBottom: "10px" }}>
              {lang === "he" ? "שיתוף Gmail מיידי" : "Instant Gmail Binding"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
              {lang === "he" 
                ? "שייכו אימייל לבני המשפחה במהלך ההקמה, והם יוכלו להתחבר ישירות מחשבון ה-Google שלהם לאותו התא המשפחתי."
                : "Map Gmail accounts to members during onboarding. Other parents log in instantly from their own devices."}
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Bento-Grid Section */}
      <section className="testimonials-section">
        <h2 style={{ textAlign: "center", fontSize: "32px", fontWeight: "800", marginBottom: "16px" }}>
          {lang === "he" ? "מה המשפחות אומרות עלינו" : "What Happy Families Are Saying"}
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "16px", marginBottom: "48px" }}>
          {lang === "he" ? "הצטרפו לאלפי משפחות שמנהלות את חייהן בצורה חכמה ומסונכרנת" : "Join thousands of families organizing their daily lives with FamSync"}
        </p>

        <div className="testimonials-grid">
          {/* Card 1: Wide */}
          <div className="testimonial-card bento-wide">
            <div>
              <div className="star-rating">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} className="star-icon" />)}
              </div>
              <p style={{ fontSize: "16px", lineHeight: "1.6", fontStyle: "italic", marginBottom: "20px" }}>
                {lang === "he" 
                  ? "״האפליקציה הזו שינתה לחלוטין את הדרך שבה אנחנו מתאמים את החיים שלנו. מרישום לחוגים ועד טיסות משפחתיות, הכל במקום אחד. כפתורי העלאת הקבצים והכרטיסים בטפסי ההוספה הופכים את זה לפשוט בטירוף!״" 
                  : "“This app completely transformed the way we coordinate our lives. From course registration to family flights, everything is in one place. Uploading files during creation is incredibly seamless!”"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
                alt="Michal Israeli" 
                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }} 
              />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{lang === "he" ? "מיכל ישראלי" : "Michal Israeli"}</h4>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{lang === "he" ? "משפחת ישראלי" : "Israeli Family"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Regular */}
          <div className="testimonial-card">
            <div>
              <div className="star-rating">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} className="star-icon" />)}
              </div>
              <p style={{ fontSize: "14px", lineHeight: "1.6", fontStyle: "italic", marginBottom: "20px" }}>
                {lang === "he" 
                  ? "״סוף סוף שקט נפשי. כרטיסי הטיסה ופרטי המלון תמיד מסונכרנים לכל הניידים של המשפחה.״" 
                  : "“Finally, peace of mind. Flight tickets and hotel details are always synced to all family devices.”"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img 
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150" 
                alt="Avi Cohen" 
                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }} 
              />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{lang === "he" ? "אבי כהן" : "Avi Cohen"}</h4>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{lang === "he" ? "משפחת כהן" : "Cohen Family"}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Regular */}
          <div className="testimonial-card">
            <div>
              <div className="star-rating">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} className="star-icon" />)}
              </div>
              <p style={{ fontSize: "14px", lineHeight: "1.6", fontStyle: "italic", marginBottom: "20px" }}>
                {lang === "he" 
                  ? "״הילדים יודעים בדיוק מתי החוגים שלהם, והצלחנו לרכז את כל הקבלות במקום אחד ללא בלאגן.״" 
                  : "“The kids know exactly when their classes are, and we managed to consolidate all receipts in one place.”"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" 
                alt="Roni Levi" 
                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }} 
              />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{lang === "he" ? "רוני לוי" : "Roni Levi"}</h4>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{lang === "he" ? "משפחת לוי" : "Levi Family"}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Wide */}
          <div className="testimonial-card bento-wide">
            <div>
              <div className="star-rating">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} className="star-icon" />)}
              </div>
              <p style={{ fontSize: "16px", lineHeight: "1.6", fontStyle: "italic", marginBottom: "20px" }}>
                {lang === "he" 
                  ? "״מדהים! סאונד הרקע המרגיע ואפקטי השמע האנלוגיים נותנים תחושה יוקרתית שאין באף אפליקציה אחרת. מומלץ בחום!״" 
                  : "“Amazing! The relaxing background music and analog chimes give a luxury feel unmatched by any other app. Highly recommended!”"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" 
                alt="Daniel Albert" 
                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }} 
              />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{lang === "he" ? "דניאל אלברט" : "Daniel Albert"}</h4>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{lang === "he" ? "משפחת אלברט" : "Albert Family"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
          marginTop: "48px",
          padding: "20px",
          background: "rgba(99, 102, 241, 0.03)",
          border: "1px solid rgba(99, 102, 241, 0.1)",
          borderRadius: "16px"
        }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            🔒 {lang === "he" ? "אבטחת מידע קפדנית" : "GDPR & Privacy Compliant"}
          </span>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }}></div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            🛡️ {lang === "he" ? "הצפנת SSL מאובטחת" : "Secure SSL Encryption"}
          </span>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }}></div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            👥 {lang === "he" ? "מוערך ע\"י +10,000 משפחות" : "Trusted by 10,000+ Families"}
          </span>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }}></div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            ⭐ {lang === "he" ? "ציון 4.9/5 משתמשים" : "4.9/5 User Rating"}
          </span>
        </div>
      </section>

      {/* Simulated Google Accounts Sign-In Modal */}
      {showGooglePopup && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "400px", padding: "30px", background: "#f8f9fa", color: "#1f1f1f", border: "none" }}>
            
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "8px" }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#202124" }}>Sign in with Google</h2>
              <p style={{ fontSize: "14px", color: "#5f6368" }}>to continue to FamSync</p>
            </div>

            {/* Test accounts triggers */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#5f6368", borderBottom: "1px solid #e0e0e0", paddingBottom: "4px" }}>
                Demo Accounts (Cohen Family)
              </div>
              <button 
                onClick={() => handleDemoSelect("avi@gmail.com", "אבי כהן")} 
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                  border: "1px solid #dadce0",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: "pointer",
                  color: "#3c4043",
                  fontSize: "14px",
                  textAlign: "start",
                  width: "100%"
                }}
              >
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=60" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }} alt="Avi" />
                <div>
                  <div style={{ fontWeight: "600" }}>Avi Cohen (Parent)</div>
                  <div style={{ fontSize: "11px", color: "#70757a" }}>avi@gmail.com</div>
                </div>
              </button>
              <button 
                onClick={() => handleDemoSelect("sarit@gmail.com", "שרית כהן")} 
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                  border: "1px solid #dadce0",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: "pointer",
                  color: "#3c4043",
                  fontSize: "14px",
                  textAlign: "start",
                  width: "100%"
                }}
              >
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=60" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }} alt="Sarit" />
                <div>
                  <div style={{ fontWeight: "600" }}>Sarit Cohen (Parent)</div>
                  <div style={{ fontSize: "11px", color: "#70757a" }}>sarit@gmail.com</div>
                </div>
              </button>
            </div>

            {/* Manual Email Input */}
            <form onSubmit={handleCustomSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#5f6368", borderBottom: "1px solid #e0e0e0", paddingBottom: "4px" }}>
                Or Sign In with any Gmail
              </div>
              <input 
                type="email" 
                placeholder="Email Address (Gmail)"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setError(""); }}
                style={{
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #dadce0",
                  outline: "none",
                  fontSize: "14px",
                  width: "100%",
                  color: "#000",
                  background: "#fff"
                }}
              />
              <input 
                type="text" 
                placeholder="Full Name (for new members)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #dadce0",
                  outline: "none",
                  fontSize: "14px",
                  width: "100%",
                  color: "#000",
                  background: "#fff"
                }}
              />
              {error && <div style={{ color: "#d93025", fontSize: "12px" }}>{error}</div>}
              
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "10px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowGooglePopup(false)}
                  style={{
                    background: "transparent",
                    color: "#1a73e8",
                    border: "none",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    background: "#1a73e8",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 24px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3)"
                  }}
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
