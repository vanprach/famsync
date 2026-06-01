import React, { useState } from "react";
import { Plus, Trash, Calendar, Clock, User, Paperclip, FileUp, ExternalLink, Edit, Check, X } from "lucide-react";
import { translations } from "../utils/translations";
import { storageAPI, MOCK_RECEIPT_URL } from "../utils/storage";
import { audioEngine } from "../utils/audio";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule({ 
  family, 
  schedules, 
  onSaveSchedule, 
  onDeleteSchedule, 
  onSaveDocument, 
  onDeleteDocument,
  lang 
}) {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState("all"); // 'all', 'parents', 'kids'
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempDocs, setTempDocs] = useState([]);

  const handleOpenAddModal = () => {
    setTempDocs([]);
    setError("");
    setTitle("");
    setDays(["Sunday"]);
    setStartTime("08:00");
    setEndTime("09:00");
    setRegistrationDate("");
    setCost("");
    setPaymentDate("");
    setActivityType("kid");
    setVenue("");
    setAddress("");
    setRow("");
    setSeat("");
    setShowAddModal(true);
  };
  
  // Detail Modal States
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);

  // Form State (New Event)
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState(family.members[0]?.id || "");
  const [days, setDays] = useState(["Sunday"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [registrationDate, setRegistrationDate] = useState("");
  const [cost, setCost] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [activityType, setActivityType] = useState("kid"); // 'kid', 'parent', 'show'
  
  // Show specific fields
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  
  const [error, setError] = useState("");

  // Edit Event State
  const [editTitle, setEditTitle] = useState("");
  const [editMemberId, setEditMemberId] = useState("");
  const [editDays, setEditDays] = useState([]);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editRegistrationDate, setEditRegistrationDate] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editActivityType, setEditActivityType] = useState("kid");
  const [editVenue, setEditVenue] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editRow, setEditRow] = useState("");
  const [editSeat, setEditSeat] = useState("");
  const [editError, setEditError] = useState("");

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);

  const getMember = (id) => {
    return family.members.find(m => m.id === id) || {};
  };

  const getActiveEvent = () => {
    return schedules.find(s => s.id === selectedEventId) || null;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t.requiredField);
      return;
    }

    const newActivity = {
      id: `sch-${Date.now()}`,
      title: title.trim(),
      memberId,
      days, // Store array of days for recurrence
      startTime,
      endTime,
      isRecurring: true,
      type: activityType, // 'kid', 'parent', 'show'
      registrationDate,
      cost: cost ? parseFloat(cost) : "",
      paymentDate,
      venue: activityType === "show" ? venue.trim() : "",
      address: activityType === "show" ? address.trim() : "",
      row: activityType === "show" ? row.trim() : "",
      seat: activityType === "show" ? seat.trim() : "",
      documents: tempDocs // Attached documents
    };

    onSaveSchedule(newActivity);
    
    // Reset Form
    setTitle("");
    setDays(["Sunday"]);
    setStartTime("08:00");
    setEndTime("09:00");
    setRegistrationDate("");
    setCost("");
    setPaymentDate("");
    setActivityType("kid");
    setVenue("");
    setAddress("");
    setRow("");
    setSeat("");
    setTempDocs([]);
    setShowAddModal(false);
    setError("");
  };

  const handleStartEdit = (event) => {
    audioEngine.playSFX("click");
    setEditTitle(event.title);
    setEditMemberId(event.memberId);
    setEditDays(event.days || [event.day] || []);
    setEditStartTime(event.startTime);
    setEditEndTime(event.endTime);
    setEditRegistrationDate(event.registrationDate || "");
    setEditCost(event.cost || "");
    setEditPaymentDate(event.paymentDate || "");
    setEditActivityType(event.type || "kid");
    setEditVenue(event.venue || "");
    setEditAddress(event.address || "");
    setEditRow(event.row || "");
    setEditSeat(event.seat || "");
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError(t.requiredField);
      return;
    }

    const activeEvent = getActiveEvent();
    
    const updatedActivity = {
      ...activeEvent,
      title: editTitle.trim(),
      memberId: editMemberId,
      days: editDays,
      startTime: editStartTime,
      endTime: editEndTime,
      type: editActivityType,
      registrationDate: editRegistrationDate,
      cost: editCost ? parseFloat(editCost) : "",
      paymentDate: editPaymentDate,
      venue: editActivityType === "show" ? editVenue.trim() : "",
      address: editActivityType === "show" ? editAddress.trim() : "",
      row: editActivityType === "show" ? editRow.trim() : "",
      seat: editActivityType === "show" ? editSeat.trim() : ""
    };

    onSaveSchedule(updatedActivity);
    setIsEditing(false);
    setEditError("");
  };

  // Temporary document upload logic (during activity creation)
  const handleAddTempDoc = async (file, slotType, slotTitleHebrew) => {
    if (!file) return;

    setIsUploading(true);
    audioEngine.playSFX("click");
    const docId = `doc-${Date.now()}`;
    const fileName = file.name;

    const fileUrl = await storageAPI.uploadDocumentFile(file);

    const newDoc = {
      id: docId,
      title: `${slotTitleHebrew} - ${title.trim() || (lang === "he" ? "חוג חדש" : "New Course")}`,
      category: "courses",
      subType: slotType, // Store slot subType
      memberId: memberId,
      fileName,
      fileUrl,
      uploadDate: new Date().toISOString().split("T")[0]
    };

    // Save document globally
    await onSaveDocument(newDoc);

    // Save document temporarily to attach to the activity when saved
    setTempDocs(prev => [...prev, newDoc]);
    setIsUploading(false);
    audioEngine.playSFX("success");
  };

  const renderAddDocSlot = (slotType, slotLabel, slotTitleHebrew) => {
    const docs = tempDocs.filter(d => d.subType === slotType);

    return (
      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "14px", marginTop: "12px" }}>
        <h5 style={{ fontSize: "14px", fontWeight: "750", marginBottom: "8px", color: "var(--primary)" }}>
          📂 {slotLabel}
        </h5>
        
        {docs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
            {docs.map(doc => (
              <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                <span style={{ maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedDocPreview(doc); }} 
                    className="inline-doc-link" 
                    style={{ fontSize: "11px", border: "none", background: "transparent", cursor: "pointer", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <ExternalLink size={10} />
                    {lang === "he" ? "הצג" : "View"}
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setTempDocs(prev => prev.filter(d => d.id !== doc.id)); if (onDeleteDocument) onDeleteDocument(doc.id); }} 
                    className="inline-doc-link" 
                    style={{ fontSize: "11px", border: "none", background: "transparent", cursor: "pointer", color: "var(--danger)", display: "flex", alignItems: "center", gap: "4px" }}
                    title={lang === "he" ? "מחק מסמך" : "Delete document"}
                  >
                    <Trash size={10} />
                    {lang === "he" ? "מחק" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontStyle: "italic" }}>
            {lang === "he" ? "אין קבצים" : "No files attached"}
          </div>
        )}

        <label className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer", display: "inline-flex", width: "100%", justifyContent: "center", borderRadius: "8px" }}>
          <FileUp size={12} />
          {lang === "he" ? `העלה ${slotTitleHebrew}` : `Upload ${slotTitleHebrew}`}
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            className="file-upload-input" 
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleAddTempDoc(file, slotType, slotTitleHebrew);
            }} 
          />
        </label>
      </div>
    );
  };

  // Upload to slot logic
  const uploadToSlot = async (file, slotType, slotTitleHebrew) => {
    const activeEvent = getActiveEvent();
    if (!activeEvent || !file) return;

    setIsUploading(true);
    audioEngine.playSFX("click");
    const docId = `doc-${Date.now()}`;
    const fileName = file.name;

    const fileUrl = await storageAPI.uploadDocumentFile(file);

    const newDoc = {
      id: docId,
      title: `${slotTitleHebrew} - ${activeEvent.title}`,
      category: "courses",
      subType: slotType, // Store slot subType
      memberId: activeEvent.memberId,
      fileName,
      fileUrl,
      uploadDate: new Date().toISOString().split("T")[0]
    };

    // Save document globally
    await onSaveDocument(newDoc);

    // Link document directly inside schedule item
    const updatedActivity = {
      ...activeEvent,
      documents: [...(activeEvent.documents || []), newDoc]
    };

    await onSaveSchedule(updatedActivity);
    setIsUploading(false);
    audioEngine.playSFX("success");
  };

  const handleDeleteSlotDoc = async (e, docId) => {
    e.stopPropagation();
    const activeEvent = getActiveEvent();
    if (!activeEvent) return;

    const confirmDel = window.confirm(lang === "he" ? "האם למחוק מסמך זה?" : "Delete this document?");
    if (!confirmDel) return;

    audioEngine.playSFX("delete");

    // 1. Remove from activity's documents list
    const updatedActivity = {
      ...activeEvent,
      documents: (activeEvent.documents || []).filter(d => d.id !== docId)
    };
    await onSaveSchedule(updatedActivity);

    // 2. Remove globally
    if (onDeleteDocument) {
      await onDeleteDocument(docId);
    }
  };

  const handleOpenDetails = (event) => {
    audioEngine.playSFX("click");
    setSelectedEventId(event.id);
    setIsEditing(false);
  };

  // Filter schedules based on tabs
  const filteredSchedules = schedules.filter(sch => {
    if (activeTab === "parents") return sch.type === "parent";
    if (activeTab === "kids") return sch.type === "kid";
    return true;
  });

  const getDayEvents = (dayName) => {
    return filteredSchedules
      .filter(sch => {
        if (sch.days && Array.isArray(sch.days)) {
          return sch.days.includes(dayName);
        }
        return sch.day === dayName; // backward compatibility
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const renderUploadSlot = (slotType, slotLabel, slotTitleHebrew) => {
    const activeEvent = getActiveEvent();
    if (!activeEvent) return null;

    const docs = (activeEvent.documents || []).filter(d => d.subType === slotType);

    return (
      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "14px", marginTop: "12px" }}>
        <h5 style={{ fontSize: "14px", fontWeight: "750", marginBottom: "8px", color: "var(--primary)" }}>
          📂 {slotLabel}
        </h5>
        
        {docs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
            {docs.map(doc => (
              <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                <span style={{ maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedDocPreview(doc); }} 
                    className="inline-doc-link" 
                    style={{ fontSize: "11px", border: "none", background: "transparent", cursor: "pointer", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <ExternalLink size={10} />
                    {lang === "he" ? "הצג" : "View"}
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleDeleteSlotDoc(e, doc.id)} 
                    className="inline-doc-link" 
                    style={{ fontSize: "11px", border: "none", background: "transparent", cursor: "pointer", color: "var(--danger)", display: "flex", alignItems: "center", gap: "4px" }}
                    title={lang === "he" ? "מחק מסמך" : "Delete document"}
                  >
                    <Trash size={10} />
                    {lang === "he" ? "מחק" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontStyle: "italic" }}>
            {lang === "he" ? "אין קבצים" : "No files attached"}
          </div>
        )}

        <label className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer", display: "inline-flex", width: "100%", justifyContent: "center", borderRadius: "8px" }}>
          <FileUp size={12} />
          {lang === "he" ? `העלה ${slotTitleHebrew}` : `Upload ${slotTitleHebrew}`}
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            className="file-upload-input" 
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) uploadToSlot(file, slotType, slotTitleHebrew);
            }} 
          />
        </label>
      </div>
    );
  };

  const activeEvent = getActiveEvent();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "800" }}>{t.scheduleTab}</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            {lang === "he" ? "נהלו את החוגים של הילדים והפעילויות שלכם" : "Manage your kids' courses and parent activities"}
          </p>
        </div>

        <button 
          onClick={() => { audioEngine.playSFX("click"); handleOpenAddModal(); }} 
          className="btn-primary"
        >
          <Plus size={18} />
          {t.addActivity}
        </button>
      </div>

      {/* Tabs */}
      <div className="schedule-tabs">
        <button 
          onClick={() => { audioEngine.playSFX("click"); setActiveTab("all"); }} 
          className={`schedule-tab ${activeTab === "all" ? "active" : ""}`}
        >
          {t.allMembers}
        </button>
        <button 
          onClick={() => { audioEngine.playSFX("click"); setActiveTab("parents"); }} 
          className={`schedule-tab ${activeTab === "parents" ? "active" : ""}`}
        >
          {t.parentsCourses}
        </button>
        <button 
          onClick={() => { audioEngine.playSFX("click"); setActiveTab("kids"); }} 
          className={`schedule-tab ${activeTab === "kids" ? "active" : ""}`}
        >
          {t.kidsCourses}
        </button>
      </div>

      {/* 7-Day Weekly Calendar View */}
      <div className="weekly-calendar">
        {DAYS_OF_WEEK.map(dayName => {
          const events = getDayEvents(dayName);
          const today = new Date().getDay();
          const isToday = DAYS_OF_WEEK[today] === dayName;
          
          return (
            <div key={dayName} className="calendar-day-col">
              <div className={`calendar-day-header ${isToday ? "today" : ""}`}>
                {t.days[dayName]}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexGrow: 1 }}>
                {events.length === 0 ? (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "20px", display: "block" }}>
                    -
                  </span>
                ) : (
                  events.map(event => {
                    const member = getMember(event.memberId);
                    return (
                      <div 
                        key={event.id} 
                        onClick={() => handleOpenDetails(event)}
                        className="calendar-event"
                        style={{ 
                          borderInlineStartColor: member.color || "var(--primary)",
                          background: `rgba(${parseInt((member.color || "#8b5cf6").substring(1,3), 16)}, ${parseInt((member.color || "#8b5cf6").substring(3,5), 16)}, ${parseInt((member.color || "#8b5cf6").substring(5,7), 16)}, 0.08)`,
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                          <span className="calendar-event-title" style={{ color: member.color, fontWeight: "700" }}>
                            {event.title}
                          </span>
                        </div>
                        
                        <div className="calendar-event-time">
                          {event.startTime} - {event.endTime}
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", fontSize: "10px", color: "var(--text-secondary)" }}>
                          <img 
                            src={member.avatar} 
                            style={{ width: "12px", height: "12px", borderRadius: "50%" }} 
                            alt={member.name} 
                          />
                          <span>{member.name}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "550px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={20} color="var(--primary)" />
              {t.addActivity}
            </h3>

            <form onSubmit={handleSave}>
              {/* Event Type Select */}
              <div className="form-group">
                <label>{lang === "he" ? "סוג האירוע" : "Event Type"}</label>
                <select 
                  className="form-select"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                >
                  <option value="kid">{lang === "he" ? "👦 חוג ילדים" : "Kids Course"}</option>
                  <option value="parent">{lang === "he" ? "🧘 חוג מבוגרים" : "Adults Course"}</option>
                  <option value="show">{lang === "he" ? "🎬 הצגה / סרט / מופע" : "Show / Movie"}</option>
                </select>
              </div>

              {/* Activity Title */}
              <div className="form-group">
                <label>{activityType === "show" ? (lang === "he" ? "שם המופע / סרט" : "Show/Movie Name") : t.activityName}</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError(""); }}
                  placeholder={activityType === "show" ? (lang === "he" ? "למשל: המלט, מלך האריות" : "e.g. Hamlet") : (lang === "he" ? "למשל: שיעור גיטרה, אימון כושר" : "e.g. Guitar Lesson, Workout")}
                />
                {error && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{error}</span>}
              </div>

              {/* Assign Family Member */}
              <div className="form-group">
                <label>{t.selectMember}</label>
                <select 
                  className="form-select"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                >
                  {family.members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Specific Fields */}
              {activityType === "show" && (
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", color: "var(--primary)" }}>
                    {lang === "he" ? "פרטי המיקום והישיבה" : "Venue & Seating Details"}
                  </h4>
                  
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>{lang === "he" ? "שם האולם/מיקום" : "Venue Name"}</label>
                      <input type="text" className="form-input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={lang === "he" ? "תיאטרון הבימה, סינמה סיטי" : "e.g. Theater"} />
                    </div>
                    <div className="form-group">
                      <label>{lang === "he" ? "כתובת האירוע" : "Address"}</label>
                      <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={lang === "he" ? "שדרות תרס\"ט 2, תל אביב" : "Address"} />
                    </div>
                  </div>
                  
                  <div className="grid-cols-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>{lang === "he" ? "שורה" : "Row"}</label>
                      <input type="text" className="form-input" value={row} onChange={(e) => setRow(e.target.value)} placeholder="5" />
                    </div>
                    <div className="form-group">
                      <label>{lang === "he" ? "כיסא" : "Seat"}</label>
                      <input type="text" className="form-input" value={seat} onChange={(e) => setSeat(e.target.value)} placeholder="12" />
                    </div>
                  </div>
                </div>
              )}

              {/* Select Days (Checkbox Group) */}
              <div className="form-group">
                <label>{t.selectDay}</label>
                <div className="days-checkbox-group">
                  {DAYS_OF_WEEK.map(d => (
                    <label key={d} className="day-checkbox-label">
                      <input 
                        type="checkbox"
                        checked={days.includes(d)}
                        onChange={() => {
                          if (days.includes(d)) {
                            if (days.length > 1) setDays(days.filter(x => x !== d));
                          } else {
                            setDays([...days, d]);
                          }
                        }}
                      />
                      {t.daysShort[d]}
                    </label>
                  ))}
                </div>
              </div>

              {/* Times Row */}
              <div className="grid-cols-2">
                <div className="form-group">
                  <label>{t.startTime}</label>
                  <input 
                    type="time" 
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>{t.endTime}</label>
                  <input 
                    type="time" 
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Goal-Oriented Fields (For courses) */}
              {activityType !== "show" && (
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px" }}>
                    {lang === "he" ? "פרטי רישום ותשלום (אופציונלי)" : "Registration & Cost details (Optional)"}
                  </h4>
                  
                  <div className="form-group">
                    <label>{lang === "he" ? "תאריך רישום" : "Registration Date"}</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={registrationDate} 
                      onChange={(e) => setRegistrationDate(e.target.value)} 
                    />
                  </div>
                  
                  <div className="grid-cols-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>{lang === "he" ? "סכום ששולם" : "Paid Amount"}</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={cost} 
                        onChange={(e) => setCost(e.target.value)} 
                        placeholder="₪"
                      />
                    </div>
                    <div className="form-group">
                      <label>{lang === "he" ? "תאריך תשלום" : "Payment Date"}</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={paymentDate} 
                        onChange={(e) => setPaymentDate(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Document upload slots during creation */}
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-glass)", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  📎 {lang === "he" ? "העלאת מסמכים וקבלות" : "Upload Event Documents"}
                </h4>
                {activityType === "kid" && (
                  <div>
                    {renderAddDocSlot("registration", lang === "he" ? "אישורי רישום" : "Registration Approval", lang === "he" ? "אישור רישום" : "Registration Approval")}
                    {renderAddDocSlot("payment", lang === "he" ? "קבלות תשלום לחוג" : "Tuition Receipts", lang === "he" ? "קבלה" : "Receipt")}
                  </div>
                )}
                {activityType === "parent" && (
                  <div>
                    {renderAddDocSlot("membership", lang === "he" ? "קבלות ומסמכי מנוי" : "Training/Membership Receipts", lang === "he" ? "קבלה" : "Receipt")}
                  </div>
                )}
                {activityType === "show" && (
                  <div>
                    {renderAddDocSlot("ticket", lang === "he" ? "כרטיסי כניסה אלקטרוניים" : "Admission Tickets", lang === "he" ? "כרטיס כניסה" : "Admission Ticket")}
                    {renderAddDocSlot("receipt", lang === "he" ? "קבלות ורכישות" : "Receipts & Invoices", lang === "he" ? "קבלה" : "Receipt")}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Event Details Smart Modal */}
      {activeEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEventId(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "550px" }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <span className={`smart-badge ${activeEvent.type}`}>
                  {activeEvent.type === "parent" 
                    ? (lang === "he" ? "חוג מבוגרים" : "Adults Course") 
                    : activeEvent.type === "show" 
                    ? (lang === "he" ? "מופע / הצגה / סרט" : "Show / Movie")
                    : (lang === "he" ? "חוג ילדים" : "Kids Course")}
                </span>
                <h3 style={{ fontSize: "22px", fontWeight: "800", marginTop: "8px" }}>{activeEvent.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedEventId(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "20px" }}
              >
                <X size={20} />
              </button>
            </div>

            {isEditing ? (
              // EDIT FORM inside Details Modal
              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label>{lang === "he" ? "סוג האירוע" : "Event Type"}</label>
                  <select 
                    className="form-select"
                    value={editActivityType}
                    onChange={(e) => setEditActivityType(e.target.value)}
                  >
                    <option value="kid">{lang === "he" ? "👦 חוג ילדים" : "Kids Course"}</option>
                    <option value="parent">{lang === "he" ? "🧘 חוג מבוגרים" : "Adults Course"}</option>
                    <option value="show">{lang === "he" ? "🎬 הצגה / סרט / מופע" : "Show / Movie"}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.activityName}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editTitle}
                    onChange={(e) => { setEditTitle(e.target.value); setEditError(""); }}
                  />
                  {editError && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{editError}</span>}
                </div>

                <div className="form-group">
                  <label>{t.selectMember}</label>
                  <select 
                    className="form-select"
                    value={editMemberId}
                    onChange={(e) => setEditMemberId(e.target.value)}
                  >
                    {family.members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Edit Show Fields */}
                {editActivityType === "show" && (
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                    <div className="grid-cols-2">
                      <div className="form-group">
                        <label>{lang === "he" ? "שם האולם/מיקום" : "Venue Name"}</label>
                        <input type="text" className="form-input" value={editVenue} onChange={(e) => setEditVenue(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>{lang === "he" ? "כתובת האירוע" : "Address"}</label>
                        <input type="text" className="form-input" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="grid-cols-2" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label>{lang === "he" ? "שורה" : "Row"}</label>
                        <input type="text" className="form-input" value={editRow} onChange={(e) => setEditRow(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>{lang === "he" ? "כיסא" : "Seat"}</label>
                        <input type="text" className="form-input" value={editSeat} onChange={(e) => setEditSeat(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>{t.selectDay}</label>
                  <div className="days-checkbox-group">
                    {DAYS_OF_WEEK.map(d => (
                      <label key={d} className="day-checkbox-label">
                        <input 
                          type="checkbox"
                          checked={editDays.includes(d)}
                          onChange={() => {
                            if (editDays.includes(d)) {
                              if (editDays.length > 1) setEditDays(editDays.filter(x => x !== d));
                            } else {
                              setEditDays([...editDays, d]);
                            }
                          }}
                        />
                        {t.daysShort[d]}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>{t.startTime}</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.endTime}</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {editActivityType !== "show" && (
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                    <div className="form-group">
                      <label>{lang === "he" ? "תאריך רישום" : "Registration Date"}</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={editRegistrationDate}
                        onChange={(e) => setEditRegistrationDate(e.target.value)}
                      />
                    </div>
                    <div className="grid-cols-2" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label>{lang === "he" ? "סכום ששולם" : "Paid Amount"}</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={editCost}
                          onChange={(e) => setEditCost(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>{lang === "he" ? "תאריך תשלום" : "Payment Date"}</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={editPaymentDate}
                          onChange={(e) => setEditPaymentDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload slots inside edit form */}
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-glass)", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    📎 {lang === "he" ? "מסמכים וקבלות מצורפים" : "Attached Event Documents"}
                  </h4>
                  {editActivityType === "kid" && (
                    <div>
                      {renderUploadSlot("registration", lang === "he" ? "אישורי רישום" : "Registration Approval", lang === "he" ? "אישור רישום" : "Registration Approval")}
                      {renderUploadSlot("payment", lang === "he" ? "קבלות תשלום לחוג" : "Tuition Receipts", lang === "he" ? "קבלה" : "Receipt")}
                    </div>
                  )}
                  {editActivityType === "parent" && (
                    <div>
                      {renderUploadSlot("membership", lang === "he" ? "קבלות ומסמכי מנוי" : "Training/Membership Receipts", lang === "he" ? "קבלה" : "Receipt")}
                    </div>
                  )}
                  {editActivityType === "show" && (
                    <div>
                      {renderUploadSlot("ticket", lang === "he" ? "כרטיסי כניסה אלקטרוניים" : "Admission Tickets", lang === "he" ? "כרטיס כניסה" : "Admission Ticket")}
                      {renderUploadSlot("receipt", lang === "he" ? "קבלות ורכישות" : "Receipts & Invoices", lang === "he" ? "קבלה" : "Receipt")}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ flex: 1 }}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    <Check size={16} />
                    {t.save}
                  </button>
                </div>
              </form>
            ) : (
              // SMART DETAIL LAYOUT (Goal-oriented)
              <div>
                
                {/* Member Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid var(--border-glass)" }}>
                  <img 
                    src={getMember(activeEvent.memberId).avatar} 
                    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${getMember(activeEvent.memberId).color}` }} 
                    alt={getMember(activeEvent.memberId).name} 
                  />
                  <div>
                    <div style={{ fontWeight: "700" }}>{getMember(activeEvent.memberId).name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {getMember(activeEvent.memberId).role === "parent" ? t.roleParent : t.roleKid}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ margin: "20px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  {/* Common Details */}
                  <div style={{ display: "flex", gap: "8px", fontSize: "14px" }}>
                    <Clock size={16} color="var(--primary)" />
                    <div>
                      <strong>{lang === "he" ? "לוח זמנים:" : "Schedule:"}</strong>{" "}
                      {activeEvent.startTime} - {activeEvent.endTime} |{" "}
                      {activeEvent.days ? activeEvent.days.map(d => t.days[d]).join(", ") : t.days[activeEvent.day]}
                    </div>
                  </div>

                  {/* Dynamic Fields: Kid's Course details */}
                  {activeEvent.type === "kid" && (
                    <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                      <h4 style={{ fontWeight: "700", color: "var(--success)" }}>👦 {lang === "he" ? "מעקב חוגי ילדים" : "Kids Course Tracking"}</h4>
                      
                      {activeEvent.registrationDate && (
                        <div>
                          <strong>{lang === "he" ? "תאריך רישום לחוג:" : "Registration Date:"}</strong> {activeEvent.registrationDate}
                        </div>
                      )}
                      
                      {activeEvent.cost && (
                        <div>
                          <strong>{lang === "he" ? "עלות החוג ששולמה:" : "Course Tuition Paid:"}</strong> ₪{activeEvent.cost}
                          {activeEvent.paymentDate && ` (${lang === "he" ? "שולם בתאריך" : "paid on"} ${activeEvent.paymentDate})`}
                        </div>
                      )}
                      
                      {(!activeEvent.registrationDate && !activeEvent.cost) && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                          {lang === "he" ? "אין מידע פיננסי מעודכן לחוג זה. לחץ 'ערוך' להזנת פרטים." : "No financial details logged. Click 'Edit' to add details."}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic Fields: Adult's Course details */}
                  {activeEvent.type === "parent" && (
                    <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.15)", display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                      <h4 style={{ fontWeight: "700", color: "var(--primary)" }}>🧘 {lang === "he" ? "לו\"ז ומעקב הורים" : "Adult Course & Fitness Tracking"}</h4>
                      
                      {activeEvent.registrationDate && (
                        <div>
                          <strong>{lang === "he" ? "תאריך הצטרפות:" : "Date Joined:"}</strong> {activeEvent.registrationDate}
                        </div>
                      )}

                      {activeEvent.cost && (
                        <div>
                          <strong>{lang === "he" ? "עלות מנוי/אימון:" : "Membership Cost:"}</strong> ₪{activeEvent.cost}
                          {activeEvent.paymentDate && ` (${lang === "he" ? "שולם בתאריך" : "paid on"} ${activeEvent.paymentDate})`}
                        </div>
                      )}

                      {(!activeEvent.registrationDate && !activeEvent.cost) && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                          {lang === "he" ? "אין מידע פיננסי מעודכן לאימון זה. לחץ 'ערוך' להזנת פרטים." : "No membership details logged. Click 'Edit' to add details."}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic Fields: Show / Movie details */}
                  {activeEvent.type === "show" && (
                    <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.15)", display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                      <h4 style={{ fontWeight: "700", color: "var(--info)" }}>🎬 {lang === "he" ? "פרטי מופע / הצגה / סרט" : "Show / Movie Details"}</h4>
                      
                      {activeEvent.venue && (
                        <div>
                          <strong>{lang === "he" ? "מיקום/אולם:" : "Venue:"}</strong> {activeEvent.venue}
                          {activeEvent.address && ` (${activeEvent.address})`}
                        </div>
                      )}

                      {(activeEvent.row || activeEvent.seat) && (
                        <div>
                          <strong>{lang === "he" ? "מקום ישיבה:" : "Seating:"}</strong>{" "}
                          {activeEvent.row && `${lang === "he" ? "שורה" : "Row"} ${activeEvent.row}`}{" "}
                          {activeEvent.seat && `${lang === "he" ? "כיסא" : "Seat"} ${activeEvent.seat}`}
                        </div>
                      )}

                      {(!activeEvent.venue && !activeEvent.row && !activeEvent.seat) && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                          {lang === "he" ? "אין מידע על המיקום והישיבה. לחץ 'ערוך' להזנת פרטים." : "No venue or seating details logged. Click 'Edit' to add details."}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Inline Documents specific slots */}
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-glass)" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    📎 {lang === "he" ? "מסמכים וקבלות מצורפים" : "Attached Event Documents"}
                  </h4>

                  {/* Render Slots based on Event Type */}
                  {activeEvent.type === "kid" && (
                    <div>
                      {renderUploadSlot("registration", lang === "he" ? "אישורי רישום" : "Registration Approval", lang === "he" ? "אישור רישום" : "Registration Approval")}
                      {renderUploadSlot("payment", lang === "he" ? "קבלות תשלום לחוג" : "Tuition Receipts", lang === "he" ? "קבלה" : "Receipt")}
                    </div>
                  )}

                  {activeEvent.type === "parent" && (
                    <div>
                      {renderUploadSlot("membership", lang === "he" ? "קבלות ומסמכי מנוי" : "Training/Membership Receipts", lang === "he" ? "קבלה" : "Receipt")}
                    </div>
                  )}

                  {activeEvent.type === "show" && (
                    <div>
                      {renderUploadSlot("ticket", lang === "he" ? "כרטיסי כניסה אלקטרוניים" : "Admission Tickets", lang === "he" ? "כרטיס כניסה" : "Admission Ticket")}
                      {renderUploadSlot("receipt", lang === "he" ? "קבלות ורכישות" : "Receipts & Invoices", lang === "he" ? "קבלה" : "Receipt")}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
                  <button 
                    onClick={() => {
                      const confirmDel = window.confirm(lang === "he" ? "למחוק את הפעילות הזו?" : "Delete this activity?");
                      if (confirmDel) {
                        onDeleteSchedule(activeEvent.id);
                        setSelectedEventId(null);
                      }
                    }}
                    className="btn-text" 
                    style={{ color: "var(--danger)" }}
                  >
                    <Trash size={16} />
                    {t.deleteBtn}
                  </button>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handleStartEdit(activeEvent)} className="btn-secondary" style={{ padding: "8px 16px" }}>
                      <Edit size={14} />
                      {t.editBtn}
                    </button>
                    <button onClick={() => setSelectedEventId(null)} className="btn-primary" style={{ padding: "8px 16px" }}>
                      {lang === "he" ? "סגור" : "Close"}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Lightbox / Document Preview Modal inside Schedule */}
      {selectedDocPreview && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setSelectedDocPreview(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "500px", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px" }}>{selectedDocPreview.title}</h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {selectedDocPreview.uploadDate}
                </span>
              </div>
              <button 
                onClick={() => setSelectedDocPreview(null)}
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                X
              </button>
            </div>
            
            <div className="lightbox-img-container">
              <img src={selectedDocPreview.fileUrl} alt={selectedDocPreview.title} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
              <span>{lang === "he" ? "קובץ:" : "File:"} {selectedDocPreview.fileName}</span>
              <a 
                href={selectedDocPreview.fileUrl} 
                download={selectedDocPreview.fileName}
                className="btn-text"
                style={{ color: "var(--primary)", fontWeight: "bold" }}
              >
                📥 {lang === "he" ? "הורד קובץ" : "Download File"}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
