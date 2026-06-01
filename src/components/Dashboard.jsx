import React, { useState } from "react";
import { Calendar, Plane, Plus, FileUp, Shield, HelpCircle, Trash, CheckSquare, Square, ListTodo, ShoppingCart } from "lucide-react";
import { translations } from "../utils/translations";
import { audioEngine } from "../utils/audio";

export default function Dashboard({ 
  currentUser, 
  family, 
  schedules, 
  trips, 
  onNavigate,
  lang,
  onQuickUploadDoc,
  tasks = [],
  onSaveTask,
  onDeleteTask
}) {
  if (!family) return null;
  const t = translations[lang];

  // Tab state for the Chores / Grocery widget
  const [activeWidgetTab, setActiveWidgetTab] = useState("chores");
  const [newChoreText, setNewChoreText] = useState("");
  const [newChoreAssignee, setNewChoreAssignee] = useState("");
  const [newGroceryText, setNewGroceryText] = useState("");

  // Helper to get today's day name in English (to map to schedule data)
  const getTodayDayName = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  };

  const todayDayName = getTodayDayName();
  
  // Filter activities happening today (supporting multi-day arrays)
  const todaySchedules = schedules.filter(sch => {
    if (sch.days && Array.isArray(sch.days)) {
      return sch.days.includes(todayDayName);
    }
    return sch.day === todayDayName;
  });

  // Get member details helper
  const getMember = (memberId) => {
    return family.members.find(m => m.id === memberId) || {};
  };

  // Filter tasks into chores and grocery lists
  const chores = tasks.filter(t => t.type === "chore");
  const groceries = tasks.filter(t => t.type === "grocery");

  const handleAddChore = (e) => {
    e.preventDefault();
    if (!newChoreText.trim()) return;
    
    audioEngine.playSFX("success");
    const newTask = {
      id: `task-${Date.now()}`,
      title: newChoreText.trim(),
      type: "chore",
      completed: false,
      memberId: newChoreAssignee || null
    };
    onSaveTask(newTask);
    setNewChoreText("");
    setNewChoreAssignee("");
  };

  const handleAddGrocery = (e) => {
    e.preventDefault();
    if (!newGroceryText.trim()) return;

    audioEngine.playSFX("success");
    const newTask = {
      id: `task-${Date.now()}`,
      title: newGroceryText.trim(),
      type: "grocery",
      completed: false
    };
    onSaveTask(newTask);
    setNewGroceryText("");
  };

  const handleToggleTask = (task) => {
    if (!task.completed) {
      audioEngine.playSFX("success");
    } else {
      audioEngine.playSFX("click");
    }
    const updated = {
      ...task,
      completed: !task.completed
    };
    onSaveTask(updated);
  };

  return (
    <div>
      {/* Upper header segment */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "850", marginBottom: "4px" }}>
            {t.greeting}, {currentUser.name}!
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            {lang === "he" 
              ? `משפחת ${family.name} | לוח הבקרה המשפחתי`
              : `${family.name} Family Hub | Dashboard`}
          </p>
        </div>

        {/* Current user chip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 16px",
          background: "var(--bg-secondary)",
          borderRadius: "30px",
          border: "1px solid var(--border-glass)"
        }}>
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${currentUser.color}` }}
          />
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700" }}>{currentUser.name}</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "capitalize" }}>
              {currentUser.role === "parent" ? t.roleParent : t.roleKid}
            </div>
          </div>
        </div>
      </div>

      {/* Active Family Members horizontal bar */}
      <div style={{ marginBottom: "24px" }}>
        <h3 className="section-title" style={{ fontSize: "16px", color: "var(--text-secondary)" }}>
          {t.activeFamilyMembers}
        </h3>
        <div className="members-list-horizontal">
          {family.members.map(m => (
            <div 
              key={m.id} 
              className="member-chip active"
              style={{ borderLeft: lang === "he" ? "none" : `3px solid ${m.color}`, borderRight: lang === "he" ? `3px solid ${m.color}` : "none" }}
            >
              <img src={m.avatar} className="member-chip-img" alt={m.name} />
              <span style={{ fontSize: "14px", fontWeight: "600" }}>{m.name}</span>
              {m.email && (
                <span style={{ fontSize: "10px", color: "var(--text-muted)", direction: "ltr" }}>
                  ({m.email})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Left Side: Schedule & Trips */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Today's Schedule */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 className="section-title">
              <Calendar size={20} color="var(--primary)" />
              {t.todaySchedule} ({t.days[todayDayName]})
            </h3>
            
            {todaySchedules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                <p>{t.noActivitiesToday}</p>
              </div>
            ) : (
              <div className="schedule-list">
                {todaySchedules.map(sch => {
                  const m = getMember(sch.memberId);
                  return (
                    <div 
                      key={sch.id} 
                      className="schedule-card"
                      style={{ borderInlineStartColor: m.color || "var(--primary)" }}
                    >
                      <div className="schedule-details">
                        <span style={{ fontWeight: "700", fontSize: "16px" }}>{sch.title}</span>
                        <div className="schedule-member">
                          <img 
                            src={m.avatar} 
                            style={{ width: "16px", height: "16px", borderRadius: "50%" }} 
                            alt={m.name} 
                          />
                          <span>
                            {m.name} ({m.role === "parent" ? t.roleParent : t.roleKid})
                          </span>
                        </div>
                      </div>
                      <div className="schedule-time">
                        <span>{sch.startTime} - {sch.endTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <button 
              onClick={() => onNavigate("schedule")}
              className="btn-text" 
              style={{ marginTop: "16px", fontWeight: "700", fontSize: "14px", color: "var(--primary)" }}
            >
              {lang === "he" ? "← צפה בלוח הזמנים המלא" : "View full schedule →"}
            </button>
          </div>

          {/* Upcoming Trips */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 className="section-title">
              <Plane size={20} color="var(--primary)" />
              {t.upcomingTrips}
            </h3>
            
            {trips.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                <p>{t.noUpcomingTrips}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {trips.map(trip => (
                  <div 
                    key={trip.id} 
                    className="dashboard-trip-card"
                    style={{ 
                      padding: "16px", 
                      borderRadius: "12px", 
                      background: "rgba(255,255,255,0.01)", 
                      border: "1px solid var(--border-glass)",
                      cursor: "pointer"
                    }}
                    onClick={() => onNavigate("travel")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "700" }}>
                      <span>{trip.name}</span>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
                      {trip.flight && (
                        <div>
                          <strong>✈️ {t.flightSection}:</strong> {trip.flight.airline} ({trip.flight.flightNumber})
                        </div>
                      )}
                      {trip.hotel && (
                        <div>
                          <strong>🏨 {t.hotelSection}:</strong> {trip.hotel.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => onNavigate("travel")}
              className="btn-text" 
              style={{ marginTop: "16px", fontWeight: "700", fontSize: "14px", color: "var(--primary)" }}
            >
              {lang === "he" ? "← נהל נסיעות ומסמכים" : "Manage trips & documents →"}
            </button>
          </div>

        </div>

        {/* Right Side: Quick Actions & Instructions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Quick Actions Panel */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 className="section-title">
              <Plus size={20} color="var(--primary)" />
              {t.quickActions}
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button 
                onClick={() => onNavigate("schedule")}
                className="btn-secondary" 
                style={{ justifyContent: "flex-start", width: "100%" }}
              >
                <Calendar size={18} color="var(--primary)" />
                {t.addActivity}
              </button>

              <button 
                onClick={() => onNavigate("travel")}
                className="btn-secondary" 
                style={{ justifyContent: "flex-start", width: "100%" }}
              >
                <Plane size={18} color="var(--primary)" />
                {t.addTrip}
              </button>
            </div>
          </div>

          {/* Family Chores & Grocery List Card */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h3 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <ListTodo size={20} color="var(--primary)" />
                {lang === "he" ? "מטלות וקניות" : "Chores & Groceries"}
              </h3>
              
              <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "2px", border: "1px solid var(--border-glass)" }}>
                <button
                  type="button"
                  onClick={() => { audioEngine.playSFX("click"); setActiveWidgetTab("chores"); }}
                  style={{
                    background: activeWidgetTab === "chores" ? "var(--primary)" : "transparent",
                    color: activeWidgetTab === "chores" ? "#ffffff" : "var(--text-secondary)",
                    border: "none",
                    borderRadius: "18px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {lang === "he" ? "מטלות" : "Chores"}
                </button>
                <button
                  type="button"
                  onClick={() => { audioEngine.playSFX("click"); setActiveWidgetTab("grocery"); }}
                  style={{
                    background: activeWidgetTab === "grocery" ? "var(--primary)" : "transparent",
                    color: activeWidgetTab === "grocery" ? "#ffffff" : "var(--text-secondary)",
                    border: "none",
                    borderRadius: "18px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {lang === "he" ? "קניות" : "Groceries"}
                </button>
              </div>
            </div>

            {/* TAB CONTENT: CHORES */}
            {activeWidgetTab === "chores" && (
              <div>
                {/* Add Chore form */}
                <form onSubmit={handleAddChore} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <input
                    type="text"
                    value={newChoreText}
                    onChange={(e) => setNewChoreText(e.target.value)}
                    placeholder={lang === "he" ? "הוסף מטלה משפחתית..." : "Add a family chore..."}
                    className="form-input"
                    style={{ flexGrow: 1, padding: "8px 12px", fontSize: "13px", height: "38px" }}
                  />
                  <select
                    value={newChoreAssignee}
                    onChange={(e) => setNewChoreAssignee(e.target.value)}
                    className="form-select"
                    style={{ width: "90px", padding: "8px", fontSize: "13px", height: "38px" }}
                  >
                    <option value="">{lang === "he" ? "מי?" : "Who?"}</option>
                    {family.members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="btn-primary" style={{ padding: "0 14px", height: "38px", minWidth: "50px", justifyContent: "center" }}>
                    <Plus size={16} />
                  </button>
                </form>

                {/* Chores List */}
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingLeft: "4px", paddingRight: "4px" }}>
                  {chores.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
                      {lang === "he" ? "אין מטלות פתוחות" : "No open chores"}
                    </div>
                  ) : (
                    chores.map(chore => {
                      const assignee = chore.memberId ? getMember(chore.memberId) : null;
                      return (
                        <div
                          key={chore.id}
                          className="task-item-card"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 12px",
                            background: chore.completed ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
                            border: "1px solid var(--border-glass)",
                            borderRadius: "10px",
                            opacity: chore.completed ? 0.65 : 1,
                            transition: "all 0.3s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "70%" }}>
                            <button
                              type="button"
                              onClick={() => handleToggleTask(chore)}
                              style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
                            >
                              {chore.completed ? (
                                <CheckSquare size={18} color="var(--success)" style={{ stroke: "var(--success)" }} />
                              ) : (
                                <Square size={18} color="var(--text-secondary)" />
                              )}
                            </button>
                            <span style={{
                              fontSize: "13px",
                              textDecoration: chore.completed ? "line-through" : "none",
                              color: chore.completed ? "var(--text-muted)" : "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}>
                              {chore.title}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {assignee && assignee.avatar && (
                              <img
                                src={assignee.avatar}
                                title={assignee.name}
                                style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1.5px solid ${assignee.color || "var(--primary)"}`, objectFit: "cover" }}
                                alt={assignee.name}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => { audioEngine.playSFX("click"); onDeleteTask(chore.id); }}
                              style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                              title={lang === "he" ? "מחק מטלה" : "Delete chore"}
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: GROCERY */}
            {activeWidgetTab === "grocery" && (
              <div>
                {/* Add Grocery form */}
                <form onSubmit={handleAddGrocery} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <input
                    type="text"
                    value={newGroceryText}
                    onChange={(e) => setNewGroceryText(e.target.value)}
                    placeholder={lang === "he" ? "הוסף מוצר לרשימה..." : "Add item to list..."}
                    className="form-input"
                    style={{ flexGrow: 1, padding: "8px 12px", fontSize: "13px", height: "38px" }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: "0 14px", height: "38px", minWidth: "50px", justifyContent: "center" }}>
                    <Plus size={16} />
                  </button>
                </form>

                {/* Grocery List */}
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingLeft: "4px", paddingRight: "4px" }}>
                  {groceries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
                      {lang === "he" ? "הרשימה ריקה" : "The list is empty"}
                    </div>
                  ) : (
                    groceries.map(item => (
                      <div
                        key={item.id}
                        className="task-item-card"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 12px",
                          background: item.completed ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
                          border: "1px solid var(--border-glass)",
                          borderRadius: "10px",
                          opacity: item.completed ? 0.65 : 1,
                          transition: "all 0.3s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "85%" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleTask(item)}
                            style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
                          >
                            {item.completed ? (
                              <CheckSquare size={18} color="var(--success)" style={{ stroke: "var(--success)" }} />
                            ) : (
                              <Square size={18} color="var(--text-secondary)" />
                            )}
                          </button>
                          <span style={{
                            fontSize: "13px",
                            textDecoration: item.completed ? "line-through" : "none",
                            color: item.completed ? "var(--text-muted)" : "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {item.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => { audioEngine.playSFX("click"); onDeleteTask(item.id); }}
                          style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                          title={lang === "he" ? "מחק מוצר" : "Delete item"}
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="glass-panel" style={{ padding: "24px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)" }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "15px" }}>
              <Shield size={16} color="var(--primary)" />
              {lang === "he" ? "אבטחה ושיתוף Gmail" : "Security & Gmail Sharing"}
            </h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", direction: "rtl" }}>
              {lang === "he" ? (
                <>
                  בני משפחה שהוגדרה עבורם כתובת Gmail (כמו הורים) יכולים להתחבר ישירות לאפליקציה באמצעות כפתור ה-Google Login ויופנו אוטומטית לקבוצה המשפחתית הזו. 
                  <br /><br />
                  עבור הילדים, אין צורך בכתובת Gmail, ההורים מנהלים את החוגים והפעילויות שלהם ישירות מכאן!
                </>
              ) : (
                <>
                  Family members associated with a Gmail (like parents) can log in via Google Login to access this same family space instantly.
                  <br /><br />
                  For kids without email, parents can manage their schedules and document vault directly from their own accounts!
                </>
              )}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
