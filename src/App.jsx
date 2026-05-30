import React, { useState, useEffect } from "react";
import { LayoutDashboard, Calendar, Plane, FolderLock, Settings as SettingsIcon, LogOut } from "lucide-react";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import Schedule from "./components/Schedule";
import TravelHub from "./components/TravelHub";
import DocumentVault from "./components/DocumentVault";
import Settings from "./components/Settings";
import { storageAPI } from "./utils/storage";
import { translations } from "./utils/translations";

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
            // Fetch schedules, trips and documents linked to this family
            const sch = await storageAPI.getSchedules(activeFamily.id);
            setSchedules(sch);
            const tr = await storageAPI.getTrips(activeFamily.id);
            setTrips(tr);
            const doc = await storageAPI.getDocuments(activeFamily.id);
            setDocuments(doc);
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
    } else {
      setFamily(null);
      setSchedules([]);
      setTrips([]);
      setDocuments([]);
    }
    setActiveTab("dashboard");
  };

  const handleOnboardingSuccess = async (user) => {
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
    }
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    storageAPI.logout();
    setCurrentUser(null);
    setFamily(null);
    setSchedules([]);
    setTrips([]);
    setDocuments([]);
    setActiveTab("dashboard");
  };

  // State Updates
  const handleSaveSchedule = async (item) => {
    if (!family) return;
    await storageAPI.saveScheduleItem(family.id, item);
    const sch = await storageAPI.getSchedules(family.id);
    setSchedules(sch);
  };

  const handleDeleteSchedule = async (itemId) => {
    if (!family) return;
    await storageAPI.deleteScheduleItem(family.id, itemId);
    const sch = await storageAPI.getSchedules(family.id);
    setSchedules(sch);
  };

  const handleSaveTrip = async (trip) => {
    if (!family) return;
    await storageAPI.saveTrip(family.id, trip);
    const tr = await storageAPI.getTrips(family.id);
    setTrips(tr);
  };

  const handleDeleteTrip = async (tripId) => {
    if (!family) return;
    await storageAPI.deleteTrip(family.id, tripId);
    const tr = await storageAPI.getTrips(family.id);
    setTrips(tr);
  };

  const handleSaveDocument = async (doc) => {
    if (!family) return;
    await storageAPI.saveDocument(family.id, doc);
    const docList = await storageAPI.getDocuments(family.id);
    setDocuments(docList);
  };

  const handleDeleteDocument = async (docId) => {
    if (!family) return;
    await storageAPI.deleteDocument(family.id, docId);
    const docList = await storageAPI.getDocuments(family.id);
    setDocuments(docList);
  };

  const handleSaveFamily = async (updatedFamily) => {
    await storageAPI.saveFamily(updatedFamily);
    setFamily(updatedFamily);
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
            <button onClick={() => setActiveTab("dashboard")}>
              <LayoutDashboard />
              {t.dashboardTab}
            </button>
          </li>
          <li className={`nav-item ${activeTab === "schedule" ? "active" : ""}`}>
            <button onClick={() => setActiveTab("schedule")}>
              <Calendar />
              {t.scheduleTab}
            </button>
          </li>
          <li className={`nav-item ${activeTab === "travel" ? "active" : ""}`}>
            <button onClick={() => setActiveTab("travel")}>
              <Plane />
              {t.travelTab}
            </button>
          </li>
          <li className={`nav-item ${activeTab === "vault" ? "active" : ""}`}>
            <button onClick={() => setActiveTab("vault")}>
              <FolderLock />
              {t.documentsTab}
            </button>
          </li>
          <li className={`nav-item ${activeTab === "settings" ? "active" : ""}`}>
            <button onClick={() => setActiveTab("settings")}>
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
          onClick={() => setActiveTab("dashboard")} 
          className={`mobile-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
        >
          <LayoutDashboard />
          <span>{t.dashboardTab}</span>
        </button>
        <button 
          onClick={() => setActiveTab("schedule")} 
          className={`mobile-nav-item ${activeTab === "schedule" ? "active" : ""}`}
        >
          <Calendar />
          <span>{t.scheduleTab}</span>
        </button>
        <button 
          onClick={() => setActiveTab("travel")} 
          className={`mobile-nav-item ${activeTab === "travel" ? "active" : ""}`}
        >
          <Plane />
          <span>{t.travelTab}</span>
        </button>
        <button 
          onClick={() => setActiveTab("vault")} 
          className={`mobile-nav-item ${activeTab === "vault" ? "active" : ""}`}
        >
          <FolderLock />
          <span>{t.documentsTab}</span>
        </button>
        <button 
          onClick={() => setActiveTab("settings")} 
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
            onNavigate={setActiveTab}
            lang={lang}
            onQuickUploadDoc={() => setActiveTab("vault")}
          />
        )}

        {activeTab === "schedule" && (
          <Schedule 
            family={family} 
            schedules={schedules} 
            onSaveSchedule={handleSaveSchedule} 
            onDeleteSchedule={handleDeleteSchedule}
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
            lang={lang}
          />
        )}

        {activeTab === "vault" && (
          <DocumentVault 
            family={family} 
            documents={documents} 
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

    </div>
  );
}
