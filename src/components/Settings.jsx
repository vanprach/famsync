import React, { useState } from "react";
import { Globe, UserPlus, LogOut, Check, ShieldAlert, Upload } from "lucide-react";
import { translations } from "../utils/translations";
import { storageAPI, MOCK_AVATARS } from "../utils/storage";

const PRESET_COLORS = ["#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function Settings({ 
  family, 
  onSaveFamily, 
  lang, 
  setLang, 
  onLogout 
}) {
  const t = translations[lang];

  const [showAddMember, setShowAddMember] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("kid");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [avatar, setAvatar] = useState(MOCK_AVATARS[0]);
  const [error, setError] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.requiredField);
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    if (role === "parent" && !cleanEmail) {
      setError(t.requiredField);
      return;
    }
    
    if (cleanEmail) {
      if (!cleanEmail.includes("@")) {
        setError(t.invalidGmail);
        return;
      }
      
      // Check for duplicate Gmail in family
      const emailExists = family.members.some(
        m => m.email && m.email.toLowerCase().trim() === cleanEmail
      );
      if (emailExists) {
        setError(t.duplicateGmail);
        return;
      }
    }

    const newMember = {
      id: `member-${Date.now()}`,
      name: name.trim(),
      role,
      email: cleanEmail,
      color,
      avatar
    };

    // Update family
    const updatedFamily = {
      ...family,
      members: [...family.members, newMember]
    };

    onSaveFamily(updatedFamily);

    // Reset Form
    setName("");
    setRole("kid");
    setEmail("");
    setColor(PRESET_COLORS[0]);
    setAvatar(MOCK_AVATARS[0]);
    setShowAddMember(false);
    setError("");
  };

  return (
    <div>
      <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "24px" }}>{t.settingsTab}</h2>

      <div className="settings-grid">
        
        {/* Left Side: General settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Language Switcher */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 className="section-title">
              <Globe size={20} color="var(--primary)" />
              {t.languageConfig}
            </h3>
            
            <p style={{ color: "var(--text-secondary)", marginBottom: "16px", fontSize: "14px" }}>
              {lang === "he" ? "בחרו את שפת הממשק הרצויה:" : "Select your preferred application language:"}
            </p>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setLang("he")}
                className={`btn-secondary ${lang === "he" ? "active" : ""}`}
                style={{ 
                  flex: 1, 
                  backgroundColor: lang === "he" ? "var(--primary)" : "rgba(255,255,255,0.03)",
                  color: lang === "he" ? "#fff" : "var(--text-secondary)",
                  border: lang === "he" ? "none" : "1px solid var(--border-glass)"
                }}
              >
                עברית (RTL)
              </button>
              <button 
                onClick={() => setLang("en")}
                className={`btn-secondary ${lang === "en" ? "active" : ""}`}
                style={{ 
                  flex: 1, 
                  backgroundColor: lang === "en" ? "var(--primary)" : "rgba(255,255,255,0.03)",
                  color: lang === "en" ? "#fff" : "var(--text-secondary)",
                  border: lang === "en" ? "none" : "1px solid var(--border-glass)"
                }}
              >
                English (LTR)
              </button>
            </div>
          </div>

          {/* Account/System details */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 className="section-title">
              <ShieldAlert size={20} color="var(--primary)" />
              {t.configSection}
            </h3>
            
            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{t.currentFamily}:</span>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--primary)", marginTop: "4px" }}>
                משפחת {family.name}
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="btn-danger" 
              style={{ width: "100%", justifyContent: "center" }}
            >
              <LogOut size={16} />
              {t.logout}
            </button>
          </div>

        </div>

        {/* Right Side: Manage members */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                {t.activeFamilyMembers}
              </h3>
              
              {!showAddMember && (
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  <UserPlus size={12} />
                  {lang === "he" ? "הוסף" : "Add"}
                </button>
              )}
            </div>

            {showAddMember ? (
              <form onSubmit={handleAddMemberSubmit} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px" }}>
                <h4 style={{ fontSize: "15px", marginBottom: "16px" }}>{t.addNewMemberConfig}</h4>

                {/* Name */}
                <div className="form-group">
                  <label>{t.memberNameLabel}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={name} 
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder="שם חבר המשפחה"
                  />
                  {error && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{error}</span>}
                </div>

                {/* Role */}
                <div className="form-group">
                  <label>{t.memberRoleLabel}</label>
                  <select 
                    className="form-select" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="kid">{t.roleKid}</option>
                    <option value="parent">{t.roleParent}</option>
                  </select>
                </div>

                {/* Gmail (Required for parent, optional for kid) */}
                <div className="form-group">
                  <label>
                    {t.memberGmailLabel}
                    {role === "parent" && <span style={{ color: "var(--danger)" }}> *</span>}
                  </label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={email} 
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="example@gmail.com"
                  />
                  {role === "parent" && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {t.addGmailAlert}
                    </span>
                  )}
                </div>

                {/* Avatar Preview & selector */}
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>{t.memberAvatarLabel}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px" }}>
                    <img 
                      src={avatar} 
                      style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}` }} 
                      alt="avatar" 
                    />
                    
                    <div style={{ flexGrow: 1 }}>
                      <div className="avatar-presets">
                        {MOCK_AVATARS.map((av, avIdx) => (
                          <button
                            key={avIdx}
                            type="button"
                            onClick={() => setAvatar(av)}
                            className={`avatar-preset-btn ${avatar === av ? "selected" : ""}`}
                            style={{ width: "28px", height: "28px" }}
                          >
                            <img src={av} alt={`Preset ${avIdx}`} />
                          </button>
                        ))}
                      </div>

                      <label 
                        className="btn-secondary" 
                        style={{ 
                          padding: "4px 8px", 
                          fontSize: "11px", 
                          borderRadius: "6px", 
                          marginTop: "8px", 
                          display: "inline-flex",
                          cursor: "pointer"
                        }}
                      >
                        <Upload size={10} />
                        {t.avatarUploadBtn}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="file-upload-input" 
                          onChange={handleImageUpload} 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Color presets */}
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label>{t.memberColorLabel}</label>
                  <div className="color-presets">
                    {PRESET_COLORS.map(c => (
                      <button 
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`color-preset-btn ${color === c ? "selected" : ""}`}
                        style={{ backgroundColor: c, width: "24px", height: "24px" }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setName("");
                      setEmail("");
                      setShowAddMember(false);
                    }}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    <Check size={16} />
                    {t.save}
                  </button>
                </div>

              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {family.members.map(m => (
                  <div 
                    key={m.id}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "10px", 
                      background: "rgba(255,255,255,0.01)", 
                      border: "1px solid var(--border-glass)", 
                      borderRadius: "12px" 
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img 
                        src={m.avatar} 
                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${m.color}` }} 
                        alt={m.name} 
                      />
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "14px" }}>{m.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {m.role === "parent" ? t.roleParent : t.roleKid}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", direction: "ltr" }}>
                      {m.email || (lang === "he" ? "ללא אימייל" : "No Email")}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
