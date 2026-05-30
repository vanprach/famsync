import React, { useState } from "react";
import { UserPlus, Trash, Upload, Check } from "lucide-react";
import { translations } from "../utils/translations";
import { storageAPI, MOCK_AVATARS } from "../utils/storage";

const PRESET_COLORS = ["#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function Onboarding({ currentUser, onOnboardingSuccess, lang }) {
  const t = translations[lang];
  
  const [familyName, setFamilyName] = useState("");
  const [familyColor, setFamilyColor] = useState(PRESET_COLORS[4]); // default purple
  
  // Start with the creator as the first member
  const [members, setMembers] = useState([
    {
      id: "member-creator",
      name: currentUser.name,
      role: "parent",
      email: currentUser.email,
      color: PRESET_COLORS[0],
      avatar: currentUser.avatar || MOCK_AVATARS[1]
    }
  ]);

  const [errors, setErrors] = useState({});

  const handleAddMember = () => {
    const newId = `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setMembers([
      ...members,
      {
        id: newId,
        name: "",
        role: "kid", // default to kid
        email: "",
        color: PRESET_COLORS[members.length % PRESET_COLORS.length],
        avatar: MOCK_AVATARS[members.length % MOCK_AVATARS.length]
      }
    ]);
  };

  const handleRemoveMember = (id) => {
    // Cannot remove the creator
    if (id === "member-creator") return;
    setMembers(members.filter(m => m.id !== id));
  };

  const handleMemberChange = (id, field, value) => {
    setMembers(
      members.map(m => {
        if (m.id === id) {
          // If role is changed to kid, clear email since it's optional and avoids login conflicts
          if (field === "role" && value === "kid") {
            return { ...m, [field]: value, email: "" };
          }
          return { ...m, [field]: value };
        }
        return m;
      })
    );
  };

  const handleImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleMemberChange(id, "avatar", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!familyName.trim()) {
      newErrors.familyName = t.requiredField;
    }

    // Validate members
    const emailList = [];
    members.forEach((m, idx) => {
      if (!m.name.trim()) {
        newErrors[`member_${m.id}_name`] = t.requiredField;
      }
      if (m.role === "parent" && !m.email.trim()) {
        newErrors[`member_${m.id}_email`] = t.requiredField;
      } else if (m.email.trim()) {
        if (!m.email.includes("@")) {
          newErrors[`member_${m.id}_email`] = t.invalidGmail;
        } else if (emailList.includes(m.email.toLowerCase().trim())) {
          newErrors[`member_${m.id}_email`] = t.duplicateGmail;
        } else {
          emailList.push(m.email.toLowerCase().trim());
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Process family creation
    const familyId = `family-${Date.now()}`;
    const formattedFamily = {
      id: familyId,
      name: familyName.trim(),
      color: familyColor,
      members: members.map((m, idx) => {
        // assign final ids and clean values
        return {
          ...m,
          id: m.id === "member-creator" ? `member-creator-${Date.now()}` : m.id,
          email: m.email ? m.email.toLowerCase().trim() : ""
        };
      })
    };

    // Save to local database
    storageAPI.saveFamily(formattedFamily);

    // Update currentUser state to link to this family
    const creatorInFamily = formattedFamily.members[0];
    const updatedUser = {
      ...currentUser,
      familyId: formattedFamily.id,
      familyName: formattedFamily.name,
      role: creatorInFamily.role,
      color: creatorInFamily.color,
      avatar: creatorInFamily.avatar
    };
    storageAPI.setCurrentUser(updatedUser);

    onOnboardingSuccess(updatedUser);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card glass-panel">
        <h1 className="logo-text" style={{ fontSize: "28px", marginBottom: "8px", display: "block" }}>
          {t.welcome}
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>
          {t.createFamilyTitle}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Family Surname */}
          <div className="form-group">
            <label>{t.familyNameLabel}</label>
            <input
              type="text"
              className="form-input"
              value={familyName}
              onChange={(e) => {
                setFamilyName(e.target.value);
                setErrors({ ...errors, familyName: "" });
              }}
              placeholder={lang === "he" ? "למשל: כהן, לוי" : "e.g., Smith"}
            />
            {errors.familyName && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{errors.familyName}</span>}
          </div>

          {/* Family Color */}
          <div className="form-group" style={{ marginBottom: "30px" }}>
            <label>{t.familyCoverLabel}</label>
            <div className="color-presets">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFamilyColor(c)}
                  className={`color-preset-btn ${familyColor === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Members Title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
            <h3 style={{ fontSize: "18px" }}>{t.activeFamilyMembers}</h3>
            <button
              type="button"
              onClick={handleAddMember}
              className="btn-secondary"
              style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "14px" }}
            >
              <UserPlus size={16} />
              {t.addMemberBtn}
            </button>
          </div>

          {/* Members Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "30px" }}>
            {members.map((member, index) => (
              <div 
                key={member.id} 
                className="glass-panel" 
                style={{ 
                  padding: "20px", 
                  borderRadius: "16px", 
                  borderLeft: lang === "he" ? "none" : `4px solid ${member.color}`,
                  borderRight: lang === "he" ? `4px solid ${member.color}` : "none",
                  backgroundColor: "rgba(255, 255, 255, 0.01)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    #{index + 1} - {member.role === "parent" ? t.roleParent : t.roleKid}
                    {member.id === "member-creator" && ` (${lang === "he" ? "אתה" : "You"})`}
                  </h4>
                  {member.id !== "member-creator" && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="btn-text"
                      style={{ color: "var(--danger)" }}
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>

                <div className="grid-cols-2" style={{ marginBottom: "16px" }}>
                  {/* Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t.memberNameLabel}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={member.name}
                      onChange={(e) => {
                        handleMemberChange(member.id, "name", e.target.value);
                        setErrors({ ...errors, [`member_${member.id}_name`]: "" });
                      }}
                      placeholder={member.role === "parent" ? (lang === "he" ? "אבא / אמא" : "Dad / Mom") : (lang === "he" ? "ילד / ילדה" : "Child")}
                    />
                    {errors[`member_${member.id}_name`] && (
                      <span style={{ color: "var(--danger)", fontSize: "12px" }}>{errors[`member_${member.id}_name`]}</span>
                    )}
                  </div>

                  {/* Role */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t.memberRoleLabel}</label>
                    <select
                      className="form-select"
                      value={member.role}
                      disabled={member.id === "member-creator"}
                      onChange={(e) => handleMemberChange(member.id, "role", e.target.value)}
                    >
                      <option value="parent">{t.roleParent}</option>
                      <option value="kid">{t.roleKid}</option>
                    </select>
                  </div>
                </div>

                {/* Email (Parents required, Kids optional) */}
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>
                    {t.memberGmailLabel}
                    {member.role === "parent" && <span style={{ color: "var(--danger)" }}> *</span>}
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={member.email}
                    disabled={member.id === "member-creator"}
                    onChange={(e) => {
                      handleMemberChange(member.id, "email", e.target.value);
                      setErrors({ ...errors, [`member_${member.id}_email`]: "" });
                    }}
                    placeholder="example@gmail.com"
                  />
                  {errors[`member_${member.id}_email`] && (
                    <span style={{ color: "var(--danger)", fontSize: "12px" }}>{errors[`member_${member.id}_email`]}</span>
                  )}
                  {member.role === "parent" && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {t.addGmailAlert}
                    </span>
                  )}
                </div>

                {/* Color and Avatar presets row */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>{t.memberColorLabel}</label>
                    <div className="color-presets" style={{ marginTop: "6px" }}>
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleMemberChange(member.id, "color", c)}
                          className={`color-preset-btn ${member.color === c ? "selected" : ""}`}
                          style={{ backgroundColor: c, width: "24px", height: "24px" }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>{t.memberAvatarLabel}</label>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
                      <img 
                        src={member.avatar} 
                        style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${member.color}` }} 
                        alt="Preview" 
                      />
                      
                      <div style={{ flexGrow: 1 }}>
                        <div className="avatar-presets">
                          {MOCK_AVATARS.map((av, avIdx) => (
                            <button
                              key={avIdx}
                              type="button"
                              onClick={() => handleMemberChange(member.id, "avatar", av)}
                              className={`avatar-preset-btn ${member.avatar === av ? "selected" : ""}`}
                              style={{ width: "36px", height: "36px" }}
                            >
                              <img src={av} alt={`Preset ${avIdx}`} />
                            </button>
                          ))}
                        </div>
                        
                        <label 
                          className="btn-secondary" 
                          style={{ 
                            padding: "6px 12px", 
                            fontSize: "12px", 
                            borderRadius: "8px", 
                            marginTop: "10px", 
                            display: "inline-flex",
                            cursor: "pointer"
                          }}
                        >
                          <Upload size={12} />
                          {t.avatarUploadBtn}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="file-upload-input" 
                            onChange={(e) => handleImageUpload(member.id, e)} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%" }}>
            <Check size={20} />
            {t.completeOnboarding}
          </button>
        </form>
      </div>
    </div>
  );
}
