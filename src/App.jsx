import React, { useState, useEffect } from "react";
import { LayoutDashboard, Calendar, Plane, Settings as SettingsIcon, LogOut, Volume2, VolumeX, Music } from "lucide-react";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import Schedule from "./components/Schedule";
import TravelHub from "./components/TravelHub";
import Settings from "./components/Settings";
import { storageAPI } from "./utils/storage";
import { translations } from "./utils/translations";
import { audioEngine } from "./utils/audio";

export default function App() {
  // Application Language: default is Hebrew ('he'), alternate is English ('en')
  const [lang, setLang] = useState("he");
  const t = translations[lang];

  // Auth States
  const [currentUser, setCurrentUser] = useState(() => storageAPI.getCurrentUser());
  const [family, setFamily] = useState(() => {
    const user = storageAPI.getCurrentUser();
    if (user && user.familyId) {
      // Synchronous SWR initial loader from LocalStorage cache
      return storageAPI.getLocalBackup("famsync_families", []).find(f => f.id === user.familyId) || null;
    }
    return null;
  });

  // App Routing Tab state
  const [activeTab, setActiveTab] = useState("dashboard");

  // Audio States
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleTabChange = (tab) => {
    audioEngine.playSFX("click");
    setActiveTab(tab);
  };

  const handleToggleAmbient = () => {
    audioEngine.playSFX("click");
    if (ambientPlaying) {
      audioEngine.stopAmbient();
      setAmbientPlaying(false);
    } else {
      audioEngine.startAmbient();
      setAmbientPlaying(true);
    }
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      audioEngine.playSFX("click");
    }
  };

  // Core Data States
  const [schedules, setSchedules] = useState(() => {
    const user = storageAPI.getCurrentUser();
    if (user && user.familyId) {
      const cached = storageAPI.getLocalBackup("famsync_schedules", {});
      return cached[user.familyId] || [];
    }
    return [];
  });
  const [trips, setTrips] = useState(() => {
    const user = storageAPI.getCurrentUser();
    if (user && user.familyId) {
      const cached = storageAPI.getLocalBackup("famsync_trips", {});
      return cached[user.familyId] || [];
    }
    return [];
  });
  const [documents, setDocuments] = useState(() => {
    const user = storageAPI.getCurrentUser();
    if (user && user.familyId) {
      const cached = storageAPI.getLocalBackup("famsync_documents", {});
      return cached[user.familyId] || [];
    }
    return [];
  });
  const [tasks, setTasks] = useState(() => {
    const user = storageAPI.getCurrentUser();
    if (user && user.familyId) {
      const cached = storageAPI.getLocalBackup("famsync_tasks", {});
      return cached[user.familyId] || [];
    }
    return [];
  });

  // Load Google Identity Services SDK script on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  // Dynamic direction and lang alignment on root html node
  useEffect(() => {
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.title = lang === "he" ? "FamSync - מרכז משפחתי" : "FamSync - Family Hub";
  }, [lang]);

  // Load user-bound data when auth state resolves
  useEffect(() => {
    const syncData = async () => {
      if (currentUser) {
        if (currentUser.familyId) {
          // Fetch family details from KV (asynchronous background sync)
          const activeFamily = await storageAPI.getFamily(currentUser.familyId);
          
          if (activeFamily) {
            setFamily(activeFamily);
            // Fetch schedules, trips, documents and tasks linked to this family
            const sch = await storageAPI.getSchedules(activeFamily.id);
            setSchedules(sch);
            const tr = await storageAPI.getTrips(activeFamily.id);
            setTrips(tr);
            const doc = await storageAPI.getDocuments(activeFamily.id);
            setDocuments(doc);
            const tsk = await storageAPI.getTasks(activeFamily.id);
            setTasks(tsk);
          } else {
            // If family was deleted or corrupted, reset user binding
            const resetUser = { ...currentUser, familyId: null };
            storageAPI.setCurrentUser(resetUser);
            setCurrentUser(resetUser);
            setFamily(null);
          }
        } else {
          setFamily(null);
        }
      } else {
        setFamily(null);
      }
    };

    syncData();
  }, [currentUser]);

  // Auth Callback
  const handleLoginSuccess = async (user) => {
    audioEngine.playSFX("success");
    setCurrentUser(user);
    if (user.familyId) {
      const activeFamily = await storageAPI.getFamily(user.familyId);
      setFamily(activeFamily);
      const sch = await storageAPI.getSchedules(user.familyId);
      setSchedules(sch);
      const tr = await storageAPI.getTrips(user.familyId);
      setTrips(tr);
      const doc = await storageAPI.getDocuments(user.familyId);
      setDocuments(doc);
      const tsk = await storageAPI.getTasks(user.familyId);
      setTasks(tsk);
    } else {
      setFamily(null);
      setSchedules([]);
      setTrips([]);
      setDocuments([]);
      setTasks([]);
    }
    setActiveTab("dashboard");
  };

  const handleOnboardingSuccess = async (user) => {
    audioEngine.playSFX("success");
    setCurrentUser(user);
    if (user.familyId) {
      const activeFamily = await storageAPI.getFamily(user.familyId);
      setFamily(activeFamily);
      const sch = await storageAPI.getSchedules(user.familyId);
      setSchedules(sch);
      const tr = await storageAPI.getTrips(user.familyId);
      setTrips(tr);
      const doc = await storageAPI.getDocuments(user.familyId);
      setDocuments(doc);
      const tsk = await storageAPI.getTasks(user.familyId);
      setTasks(tsk);
    }
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    audioEngine.playSFX("delete");
    storageAPI.logout();
    setCurrentUser(null);
    setFamily(null);
    setSchedules([]);
    setTrips([]);
    setDocuments([]);
    setTasks([]);
    setActiveTab("dashboard");
  };

  // State Updates
  const handleSaveSchedule = async (item) => {
    if (!family) return;
    audioEngine.playSFX("success");
    await storageAPI.saveScheduleItem(family.id, item);
    const sch = await storageAPI.getSchedules(family.id);
    setSchedules(sch);
  };

  const handleDeleteSchedule = async (itemId) => {
    if (!family) return;
    audioEngine.playSFX("delete");
    await storageAPI.deleteScheduleItem(family.id, itemId);
    const sch = await storageAPI.getSchedules(family.id);
    setSchedules(sch);
  };

  const handleSaveTrip = async (trip) => {
    if (!family) return;
    audioEngine.playSFX("success");
    await storageAPI.saveTrip(family.id, trip);
    const tr = await storageAPI.getTrips(family.id);
    setTrips(tr);
  };

  const handleDeleteTrip = async (tripId) => {
    if (!family) return;
    audioEngine.playSFX("delete");
    await storageAPI.deleteTrip(family.id, tripId);
    const tr = await storageAPI.getTrips(family.id);
    setTrips(tr);
  };

  const handleSaveDocument = async (doc) => {
    if (!family) return;
    audioEngine.playSFX("success");
    await storageAPI.saveDocument(family.id, doc);
    const docList = await storageAPI.getDocuments(family.id);
    setDocuments(docList);
  };

  const handleDeleteDocument = async (docId) => {
    if (!family) return;
    audioEngine.playSFX("delete");
    await storageAPI.deleteDocument(family.id, docId);
    const docList = await storageAPI.getDocuments(family.id);
    setDocuments(docList);
  };

  const handleSaveFamily = async (updatedFamily) => {
    audioEngine.playSFX("success");
    await storageAPI.saveFamily(updatedFamily);
    setFamily(updatedFamily);
  };

  const handleSaveTask = async (task) => {
    if (!family) return;
    await storageAPI.saveTask(family.id, task);
    const tsk = await storageAPI.getTasks(family.id);
    setTasks(tsk);
  };

  const handleDeleteTask = async (taskId) => {
    if (!family) return;
    audioEngine.playSFX("delete");
    await storageAPI.deleteTask(family.id, taskId);
    const tsk = await storageAPI.getTasks(family.id);
    setTasks(tsk);
  };

  // Rendering screen selectors
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} lang={lang} setLang={setLang} />;
  }

  if (currentUser && !currentUser.familyId) {
    return (
      <Onboarding 
        currentUser={currentUser} 
        onOnboardingSuccess={handleOnboardingSuccess} 
        lang={lang} 
      />
    );
  }

  // Guard to prevent rendering tabs if the family is still loading
  if (currentUser && currentUser.familyId && !family) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--text-secondary)" }}>
        <h3>Loading Family Hub...</h3>
      </div>
    );
  }

  // Render main core application layout when fully authenticated & onboarding complete
  return (
    <div className="app-container">
      
      {/* Desktop Sidebar Navigation */}
      <nav className="app-nav">
        <div className="logo-container">
          <span style={{ fontSize: "28px" }}>🏠</span>
          <span className="logo-text">{t.appName}</span>
        </div>

        <ul className="nav-links">
          <li className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}>
            <button onClick={() => handleTabChange("dashboard")}>
              <LayoutDashboard />
              {t.dashboardTab}
            </button>
          </li>
          <li className={`nav-item ${activeTab === "schedule" ? "active" : ""}`}>
            <button onClick={() => handleTabChange("schedule")}>
              <Calendar />
              {t.scheduleTab}
            </button>
          </li>
          <li className={`nav-item ${activeTab === "travel" ? "active" : ""}`}>
            <button onClick={() => handleTabChange("travel")}>
              <Plane />
              {t.travelTab}
            </button>
          </li>
          <li className={`nav-item ${activeTab === "settings" ? "active" : ""}`}>
            <button onClick={() => handleTabChange("settings")}>
              <SettingsIcon />
              {t.settingsTab}
            </button>
          </li>
        </ul>

        {/* Desktop Profile Info & Logout */}
        {family && (
          <div className="user-widget">
            <img 
              src={currentUser.avatar} 
              className="user-widget-avatar" 
              style={{ borderColor: currentUser.color }} 
              alt={currentUser.name} 
            />
            <div className="user-widget-info">
              <span className="user-widget-name">{currentUser.name}</span>
              <span className="user-widget-role">משפחת {family.name}</span>
            </div>
            <button 
              onClick={handleLogout} 
              style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              title={t.logout}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="mobile-nav">
        <button 
          onClick={() => handleTabChange("dashboard")} 
          className={`mobile-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
        >
          <LayoutDashboard />
          <span>{t.dashboardTab}</span>
        </button>
        <button 
          onClick={() => handleTabChange("schedule")} 
          className={`mobile-nav-item ${activeTab === "schedule" ? "active" : ""}`}
        >
          <Calendar />
          <span>{t.scheduleTab}</span>
        </button>
        <button 
          onClick={() => handleTabChange("travel")} 
          className={`mobile-nav-item ${activeTab === "travel" ? "active" : ""}`}
        >
          <Plane />
          <span>{t.travelTab}</span>
        </button>
        <button 
          onClick={() => handleTabChange("settings")} 
          className={`mobile-nav-item ${activeTab === "settings" ? "active" : ""}`}
        >
          <SettingsIcon />
          <span>{t.settingsTab}</span>
        </button>
      </nav>

      {/* Main Responsive Dashboard View */}
      <main className="app-content">
        
        {activeTab === "dashboard" && (
          <Dashboard 
            currentUser={currentUser} 
            family={family} 
            schedules={schedules} 
            trips={trips} 
            onNavigate={handleTabChange}
            lang={lang}
            onQuickUploadDoc={() => handleTabChange("schedule")}
            tasks={tasks}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === "schedule" && (
          <Schedule 
            family={family} 
            schedules={schedules} 
            onSaveSchedule={handleSaveSchedule} 
            onDeleteSchedule={handleDeleteSchedule}
            onSaveDocument={handleSaveDocument}
            onDeleteDocument={handleDeleteDocument}
            lang={lang}
          />
        )}

        {activeTab === "travel" && (
          <TravelHub 
            family={family} 
            trips={trips} 
            documents={documents}
            onSaveTrip={handleSaveTrip} 
            onDeleteTrip={handleDeleteTrip}
            onSaveDocument={handleSaveDocument}
            onDeleteDocument={handleDeleteDocument}
            lang={lang}
          />
        )}

        {activeTab === "settings" && (
          <Settings 
            family={family} 
            onSaveFamily={handleSaveFamily} 
            lang={lang} 
            setLang={setLang}
            onLogout={handleLogout}
          />
        )}

      </main>

      {/* Floating Audio Controller */}
      <div className="audio-controller-floating">
        <button 
          onClick={handleToggleMute} 
          className={`audio-btn ${isMuted ? "muted" : ""}`}
          title={isMuted ? (lang === "he" ? "בטל השתקה" : "Unmute Effects") : (lang === "he" ? "השתק אפקטים" : "Mute Effects")}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button 
          onClick={handleToggleAmbient} 
          className={`audio-btn ambient-btn ${ambientPlaying ? "playing" : ""}`}
          title={ambientPlaying ? (lang === "he" ? "עצור מוזיקת רקע" : "Stop Background Music") : (lang === "he" ? "הפעל מוזיקת רקע" : "Play Background Music")}
        >
          <Music size={16} className={ambientPlaying ? "spinning" : ""} />
          {ambientPlaying && (
            <div className="sound-wave-waves">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </button>
      </div>

    </div>
  );
}
