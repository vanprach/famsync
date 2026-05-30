import React, { useState } from "react";
import { Plus, Trash, Calendar, Clock, User } from "lucide-react";
import { translations } from "../utils/translations";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule({ family, schedules, onSaveSchedule, onDeleteSchedule, lang }) {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState("all"); // 'all', 'parents', 'kids'
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState(family.members[0]?.id || "");
  const [day, setDay] = useState("Sunday");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [error, setError] = useState("");

  const getMember = (id) => {
    return family.members.find(m => m.id === id) || {};
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t.requiredField);
      return;
    }

    const member = getMember(memberId);
    const newActivity = {
      id: `sch-${Date.now()}`,
      title: title.trim(),
      memberId,
      day,
      startTime,
      endTime,
      isRecurring: true,
      type: member.role // 'parent' or 'kid'
    };

    onSaveSchedule(newActivity);
    
    // Reset Form
    setTitle("");
    setShowAddModal(false);
    setError("");
  };

  // Filter schedules based on tabs
  const filteredSchedules = schedules.filter(sch => {
    if (activeTab === "parents") return sch.type === "parent";
    if (activeTab === "kids") return sch.type === "kid";
    return true;
  });

  // Check if a day has any events in the filtered list
  const getDayEvents = (dayName) => {
    return filteredSchedules
      .filter(sch => sch.day === dayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

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
          onClick={() => setShowAddModal(true)} 
          className="btn-primary"
        >
          <Plus size={18} />
          {t.addActivity}
        </button>
      </div>

      {/* Tabs */}
      <div className="schedule-tabs">
        <button 
          onClick={() => setActiveTab("all")} 
          className={`schedule-tab ${activeTab === "all" ? "active" : ""}`}
        >
          {t.allMembers}
        </button>
        <button 
          onClick={() => setActiveTab("parents")} 
          className={`schedule-tab ${activeTab === "parents" ? "active" : ""}`}
        >
          {t.parentsCourses}
        </button>
        <button 
          onClick={() => setActiveTab("kids")} 
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
                        className="calendar-event"
                        style={{ 
                          borderInlineStartColor: member.color || "var(--primary)",
                          background: `rgba(${parseInt((member.color || "#8b5cf6").substring(1,3), 16)}, ${parseInt((member.color || "#8b5cf6").substring(3,5), 16)}, ${parseInt((member.color || "#8b5cf6").substring(5,7), 16)}, 0.08)`
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                          <span className="calendar-event-title" style={{ color: member.color, fontWeight: "700" }}>
                            {event.title}
                          </span>
                          
                          <button 
                            onClick={() => onDeleteSchedule(event.id)}
                            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                            title={t.deleteBtn}
                          >
                            <Trash size={10} />
                          </button>
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

      {/* Schedule List breakdown for mobile view fallback, rendering clear tasks list */}
      <div className="glass-panel" style={{ padding: "20px", display: "none" /* Handled responsively or optional */ }}>
        {/* Hidden on desktop, but shown in standard layout for responsiveness */}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={20} color="var(--primary)" />
              {t.addActivity}
            </h3>

            <form onSubmit={handleSave}>
              {/* Activity Title */}
              <div className="form-group">
                <label>{t.activityName}</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError(""); }}
                  placeholder={lang === "he" ? "למשל: יוגה, שחייה" : "e.g. Yoga, Swimming"}
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
                      {m.name} ({m.role === "parent" ? t.roleParent : t.roleKid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Day */}
              <div className="form-group">
                <label>{t.selectDay}</label>
                <select 
                  className="form-select"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>
                      {t.days[d]}
                    </option>
                  ))}
                </select>
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
    </div>
  );
}
