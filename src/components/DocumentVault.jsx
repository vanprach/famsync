import React, { useState } from "react";
import { Search, FileUp, Filter, Trash, Eye, FolderOpen, Image } from "lucide-react";
import { translations } from "../utils/translations";
import { storageAPI, MOCK_RECEIPT_URL } from "../utils/storage";

export default function DocumentVault({ family, documents, onSaveDocument, onDeleteDocument, lang }) {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMemberId, setFilterMemberId] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Form states for new document
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [memberId, setMemberId] = useState(family.members[0]?.id || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    if (!title) {
      setTitle(file.name.split(".")[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t.requiredField);
      return;
    }

    const docId = `doc-${Date.now()}`;
    const finalFileName = fileName || "receipt.png";

    // Asynchronous upload to Vercel Blob (falls back to local base64 if offline)
    let fileUrl = MOCK_RECEIPT_URL;
    if (selectedFile) {
      fileUrl = await storageAPI.uploadDocumentFile(selectedFile);
    }

    const newDoc = {
      id: docId,
      title: title.trim(),
      category,
      memberId,
      fileName: finalFileName,
      fileUrl,
      uploadDate: new Date().toISOString().split("T")[0]
    };

    await onSaveDocument(newDoc);

    // Reset Form
    setTitle("");
    setCategory("general");
    setSelectedFile(null);
    setFileName("");
    setShowUploadModal(false);
    setError("");
  };

  const getMember = (id) => {
    return family.members.find(m => m.id === id) || {};
  };

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMember = filterMemberId === "all" || doc.memberId === filterMemberId;
    const matchCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchSearch && matchMember && matchCategory;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "800" }}>{t.documentsTab}</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            {lang === "he" ? "נהלו וסרקו את כל הקבלות והמסמכים המשפחתיים שלכם" : "Vault and scan all family receipts and vouchers"}
          </p>
        </div>

        <button 
          onClick={() => setShowUploadModal(true)} 
          className="btn-primary"
        >
          <FileUp size={18} />
          {t.uploadDoc}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          
          {/* Search */}
          <div style={{ flexGrow: 1, position: "relative", minWidth: "200px" }}>
            <input 
              type="text" 
              className="form-input" 
              style={{ width: "100%", paddingStart: "40px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchDocs}
            />
            <Search 
              size={18} 
              style={{ 
                position: "absolute", 
                top: "15px", 
                left: lang === "he" ? "auto" : "14px", 
                right: lang === "he" ? "14px" : "auto", 
                color: "var(--text-muted)" 
              }} 
            />
          </div>

          {/* Member Filter */}
          <div style={{ minWidth: "150px" }}>
            <select 
              className="form-select"
              style={{ width: "100%" }}
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
            >
              <option value="all">{t.filterByMember} ({lang === "he" ? "הכל" : "All"})</option>
              {family.members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: "150px" }}>
            <select 
              className="form-select"
              style={{ width: "100%" }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">{t.filterByCategory} ({lang === "he" ? "הכל" : "All"})</option>
              <option value="travel">{t.catTravel}</option>
              <option value="courses">{t.catCourses}</option>
              <option value="general">{t.catGeneral}</option>
            </select>
          </div>

        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="glass-panel" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          <FolderOpen size={48} style={{ marginBottom: "16px", strokeWidth: 1 }} />
          <p>{lang === "he" ? "לא נמצאו מסמכים התואמים לחיפוש" : "No documents match the search filters"}</p>
        </div>
      ) : (
        <div className="doc-grid">
          {filteredDocs.map(doc => {
            const member = getMember(doc.memberId);
            return (
              <div key={doc.id} className="glass-panel doc-card">
                
                {/* Thumb preview click triggers lightboxes */}
                <div 
                  className="doc-preview-thumb" 
                  onClick={() => setSelectedDoc(doc)}
                  style={{ cursor: "pointer" }}
                >
                  <img src={doc.fileUrl} alt={doc.title} />
                </div>

                <div className="doc-info">
                  <span className="doc-title" title={doc.title}>{doc.title}</span>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" }}>
                    <img 
                      src={member.avatar} 
                      style={{ width: "16px", height: "16px", borderRadius: "50%", objectFit: "cover" }} 
                      alt={member.name} 
                    />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{member.name}</span>
                  </div>

                  <div className="doc-meta">
                    <span style={{ 
                      padding: "2px 8px", 
                      borderRadius: "10px", 
                      fontSize: "10px", 
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "var(--text-secondary)"
                    }}>
                      {doc.category === "travel" ? t.catTravel : doc.category === "courses" ? t.catCourses : t.catGeneral}
                    </span>
                    <span>{doc.uploadDate}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border-glass)", paddingTop: "12px", marginTop: "4px" }}>
                  <button 
                    onClick={() => setSelectedDoc(doc)}
                    className="btn-secondary" 
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px" }}
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    onClick={() => onDeleteDocument(doc.id)}
                    className="btn-danger" 
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px" }}
                  >
                    <Trash size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "450px" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileUp size={20} color="var(--primary)" />
              {t.uploadNewDoc}
            </h3>

            <form onSubmit={handleSave}>
              {/* Document Title */}
              <div className="form-group">
                <label>{t.receiptTitle}</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError(""); }}
                  placeholder={lang === "he" ? "למשל: כרטיס טיסה, קבלה ליוגה" : "e.g., Gym Receipt"}
                />
                {error && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{error}</span>}
              </div>

              {/* Assign to Member */}
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

              {/* Category */}
              <div className="form-group">
                <label>{t.receiptCategory}</label>
                <select 
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="general">{t.catGeneral}</option>
                  <option value="travel">{t.catTravel}</option>
                  <option value="courses">{t.catCourses}</option>
                </select>
              </div>

              {/* File selector */}
              <div className="form-group">
                <label>{lang === "he" ? "בחר קובץ" : "Choose File"}</label>
                <label className="file-upload-dropzone">
                  <FileUp size={32} color="var(--text-secondary)" style={{ marginBottom: "8px" }} />
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>
                    {fileName || t.dragAndDrop}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    className="file-upload-input"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)}
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

      {/* Lightbox Preview */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "500px", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px" }}>{selectedDoc.title}</h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {getMember(selectedDoc.memberId).name} | {selectedDoc.uploadDate}
                </span>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                X
              </button>
            </div>
            
            <div className="lightbox-img-container">
              <img src={selectedDoc.fileUrl} alt={selectedDoc.title} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
              <span>{lang === "he" ? "קובץ:" : "File:"} {selectedDoc.fileName}</span>
              <a 
                href={selectedDoc.fileUrl} 
                download={selectedDoc.fileName}
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
