import React, { useState } from "react";
import { Plus, Plane, Hotel, Paperclip, FileUp, Trash, ExternalLink } from "lucide-react";
import { translations } from "../utils/translations";
import { storageAPI, MOCK_RECEIPT_URL } from "../utils/storage";

export default function TravelHub({ family, trips, documents, onSaveTrip, onDeleteTrip, onSaveDocument, lang }) {
  const t = translations[lang];

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTripForUpload, setActiveTripForUpload] = useState(null);
  
  // Trip Form States
  const [tripName, setTripName] = useState("");
  // Flight Subform
  const [airline, setAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  // Hotel Subform
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  
  const [error, setError] = useState("");

  // Document Upload States
  const [docTitle, setDocTitle] = useState("");
  const [docMemberId, setDocMemberId] = useState(family.members[0]?.id || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Open Document Lightbox Callback (handles from parent App)
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);

  const handleCreateTrip = (e) => {
    e.preventDefault();
    if (!tripName.trim()) {
      setError(t.requiredField);
      return;
    }

    const hasFlight = airline.trim() || flightNumber.trim() || bookingRef.trim();
    const hasHotel = hotelName.trim() || hotelAddress.trim() || checkIn.trim();

    const newTrip = {
      id: `trip-${Date.now()}`,
      name: tripName.trim(),
      flight: hasFlight ? {
        airline: airline.trim(),
        flightNumber: flightNumber.trim(),
        departureDate,
        arrivalDate,
        bookingRef: bookingRef.trim()
      } : null,
      hotel: hasHotel ? {
        name: hotelName.trim(),
        address: hotelAddress.trim(),
        checkIn,
        checkOut
      } : null,
      documents: [] // Array of document IDs
    };

    onSaveTrip(newTrip);

    // Reset States
    setTripName("");
    setAirline("");
    setFlightNumber("");
    setDepartureDate("");
    setArrivalDate("");
    setBookingRef("");
    setHotelName("");
    setHotelAddress("");
    setCheckIn("");
    setCheckOut("");
    setShowAddModal(false);
    setError("");
  };

  // Simulating File Upload & keeping File references
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadedFileName(file.name);
    if (!docTitle) {
      setDocTitle(file.name.split(".")[0]);
    }
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setUploadError(t.requiredField);
      return;
    }

    const docId = `doc-${Date.now()}`;
    const fileName = uploadedFileName || "simulated_receipt.png";

    // Asynchronous upload to Vercel Blob (falls back to local base64 if offline)
    let fileUrl = MOCK_RECEIPT_URL;
    if (selectedFile) {
      fileUrl = await storageAPI.uploadDocumentFile(selectedFile);
    }

    const newDoc = {
      id: docId,
      title: docTitle.trim(),
      category: "travel",
      memberId: docMemberId,
      fileName,
      fileUrl,
      uploadDate: new Date().toISOString().split("T")[0]
    };

    // Save standalone document
    await onSaveDocument(newDoc);

    // Link document to the specific trip
    const updatedTrip = {
      ...activeTripForUpload,
      documents: [...(activeTripForUpload.documents || []), docId]
    };
    await onSaveTrip(updatedTrip);

    // Reset Upload States
    setDocTitle("");
    setSelectedFile(null);
    setUploadedFileName("");
    setActiveTripForUpload(null);
    setUploadError("");
  };

  // Helper to retrieve documents attached to a specific trip
  const getTripDocuments = (tripDocIds) => {
    if (!tripDocIds) return [];
    return documents.filter(d => tripDocIds.includes(d.id));
  };

  const getMember = (id) => {
    return family.members.find(m => m.id === id) || {};
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "800" }}>{t.travelTab}</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            {lang === "he" ? "נהלו את כרטיסי הטיסה, הזמנות המלון והקבלות של המשפחה" : "Manage family boarding passes, hotels, and travel receipts"}
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn-primary"
        >
          <Plus size={18} />
          {t.addTrip}
        </button>
      </div>

      {/* Trips list */}
      {trips.length === 0 ? (
        <div className="glass-panel" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          <Plane size={48} style={{ marginBottom: "16px", strokeWidth: 1 }} />
          <p>{t.noUpcomingTrips}</p>
        </div>
      ) : (
        trips.map(trip => {
          const tripDocs = getTripDocuments(trip.documents);
          return (
            <div key={trip.id} className="glass-panel trip-card">
              <div className="trip-header">
                <h3 style={{ fontSize: "18px", fontWeight: "700" }}>✈️ {trip.name}</h3>
                
                <button 
                  onClick={() => onDeleteTrip(trip.id)}
                  className="btn-text"
                  style={{ color: "var(--danger)" }}
                >
                  <Trash size={16} />
                </button>
              </div>

              <div className="trip-grid">
                {/* Flight Section */}
                {trip.flight ? (
                  <div className="trip-segment">
                    <h4 className="segment-title">
                      <Plane size={18} />
                      {t.flightSection}
                    </h4>
                    <div className="info-row">
                      <span className="info-label">{t.airline}:</span>
                      <span className="info-value">{trip.flight.airline}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t.flightNumber}:</span>
                      <span className="info-value">{trip.flight.flightNumber}</span>
                    </div>
                    {trip.flight.departureDate && (
                      <div className="info-row">
                        <span className="info-label">{t.departureDate}:</span>
                        <span className="info-value" style={{ direction: "ltr" }}>
                          {new Date(trip.flight.departureDate).toLocaleString(lang === "he" ? "he-IL" : "en-US", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                    )}
                    {trip.flight.arrivalDate && (
                      <div className="info-row">
                        <span className="info-label">{t.arrivalDate}:</span>
                        <span className="info-value" style={{ direction: "ltr" }}>
                          {new Date(trip.flight.arrivalDate).toLocaleString(lang === "he" ? "he-IL" : "en-US", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">{t.bookingRef}:</span>
                      <span className="info-value" style={{ direction: "ltr", color: "var(--primary)" }}>{trip.flight.bookingRef}</span>
                    </div>
                  </div>
                ) : (
                  <div className="trip-segment" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px", color: "var(--text-muted)", fontSize: "14px" }}>
                    <span>{lang === "he" ? "אין פרטי טיסה מעודכנים" : "No flight details listed"}</span>
                  </div>
                )}

                {/* Hotel Section */}
                {trip.hotel ? (
                  <div className="trip-segment">
                    <h4 className="segment-title">
                      <Hotel size={18} />
                      {t.hotelSection}
                    </h4>
                    <div className="info-row">
                      <span className="info-label">{t.hotelName}:</span>
                      <span className="info-value">{trip.hotel.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t.hotelAddress}:</span>
                      <span className="info-value" style={{ fontSize: "12px", maxWidth: "60%", textAlign: "end" }}>{trip.hotel.address}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t.checkIn}:</span>
                      <span className="info-value">{trip.hotel.checkIn}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t.checkOut}:</span>
                      <span className="info-value">{trip.hotel.checkOut}</span>
                    </div>
                  </div>
                ) : (
                  <div className="trip-segment" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px", color: "var(--text-muted)", fontSize: "14px" }}>
                    <span>{lang === "he" ? "אין פרטי מלון מעודכנים" : "No hotel details listed"}</span>
                  </div>
                )}
              </div>

              {/* Trip documents / Receipts */}
              <div className="trip-attachments">
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  <Paperclip size={14} style={{ verticalAlign: "middle", marginInlineEnd: "6px" }} />
                  {t.documentsAttached}
                </h4>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  {tripDocs.map(doc => {
                    const m = getMember(doc.memberId);
                    return (
                      <div 
                        key={doc.id}
                        onClick={() => setSelectedDocPreview(doc)}
                        className="attachment-badge"
                        style={{ borderColor: m.color, color: m.color }}
                      >
                        <span style={{ fontWeight: "bold" }}>{doc.title}</span>
                        <span style={{ fontSize: "10px", opacity: 0.8 }}>({m.name})</span>
                        <ExternalLink size={10} />
                      </div>
                    );
                  })}

                  <button 
                    onClick={() => setActiveTripForUpload(trip)}
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "20px", borderStyle: "dashed" }}
                  >
                    <Plus size={12} />
                    {t.uploadDoc}
                  </button>
                </div>
              </div>

            </div>
          );
        })
      )}

      {/* Add Trip Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "600px" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plane size={20} color="var(--primary)" />
              {t.addTrip}
            </h3>

            <form onSubmit={handleCreateTrip}>
              {/* Trip Title */}
              <div className="form-group">
                <label>{t.tripName}</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={tripName}
                  onChange={(e) => { setTripName(e.target.value); setError(""); }}
                  placeholder={lang === "he" ? "למשל: חופשה משפחתית באילת" : "e.g. Vacation to Eilat"}
                />
                {error && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{error}</span>}
              </div>

              {/* Flights grid */}
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "15px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plane size={16} color="var(--primary)" />
                  {t.flightSection}
                </h4>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>{t.airline}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={airline} 
                      onChange={(e) => setAirline(e.target.value)} 
                      placeholder="El Al, Ryanair..." 
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.flightNumber}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={flightNumber} 
                      onChange={(e) => setFlightNumber(e.target.value)} 
                      placeholder="LY-381" 
                    />
                  </div>
                </div>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>{t.departureDate}</label>
                    <input 
                      type="datetime-local" 
                      className="form-input" 
                      value={departureDate} 
                      onChange={(e) => setDepartureDate(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.arrivalDate}</label>
                    <input 
                      type="datetime-local" 
                      className="form-input" 
                      value={arrivalDate} 
                      onChange={(e) => setArrivalDate(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{t.bookingRef}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={bookingRef} 
                    onChange={(e) => setBookingRef(e.target.value)} 
                    placeholder="Booking Code / PNR" 
                  />
                </div>
              </div>

              {/* Hotel fields */}
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px" }}>
                <h4 style={{ fontSize: "15px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Hotel size={16} color="var(--primary)" />
                  {t.hotelSection}
                </h4>
                <div className="form-group">
                  <label>{t.hotelName}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={hotelName} 
                    onChange={(e) => setHotelName(e.target.value)} 
                    placeholder="Hilton, Cozy Airbnb..." 
                  />
                </div>
                <div className="form-group">
                  <label>{t.hotelAddress}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={hotelAddress} 
                    onChange={(e) => setHotelAddress(e.target.value)} 
                  />
                </div>
                <div className="grid-cols-2" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label>{t.checkIn}</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={checkIn} 
                      onChange={(e) => setCheckIn(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.checkOut}</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={checkOut} 
                      onChange={(e) => setCheckOut(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

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

      {/* Upload Document Modal (triggered for a specific trip) */}
      {activeTripForUpload && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "450px" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileUp size={20} color="var(--primary)" />
              {t.uploadNewDoc}
            </h3>

            <form onSubmit={handleSaveDocument}>
              {/* Document Title */}
              <div className="form-group">
                <label>{t.receiptTitle}</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={docTitle}
                  onChange={(e) => { setDocTitle(e.target.value); setUploadError(""); }}
                  placeholder={lang === "he" ? "כרטיס עלייה למטוס, קבלה על מלון" : "e.g. Flight Ticket"}
                />
                {uploadError && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{uploadError}</span>}
              </div>

              {/* Assign to Member */}
              <div className="form-group">
                <label>{t.selectMember}</label>
                <select 
                  className="form-select"
                  value={docMemberId}
                  onChange={(e) => setDocMemberId(e.target.value)}
                >
                  {family.members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload selector */}
              <div className="form-group">
                <label>{lang === "he" ? "בחר קובץ" : "Choose File"}</label>
                <label className="file-upload-dropzone">
                  <FileUp size={32} color="var(--text-secondary)" style={{ marginBottom: "8px" }} />
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>
                    {uploadedFileName || t.dragAndDrop}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {lang === "he" ? "(תומך בתמונות וקבלות)" : "(Supports images & documents)"}
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
                  onClick={() => {
                    setDocTitle("");
                    setUploadedBase64("");
                    setUploadedFileName("");
                    setActiveTripForUpload(null);
                  }}
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

      {/* Lightbox / Document Preview Modal */}
      {selectedDocPreview && (
        <div className="modal-overlay" onClick={() => setSelectedDocPreview(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "500px", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px" }}>{selectedDocPreview.title}</h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {t.greeting} {getMember(selectedDocPreview.memberId).name} | {selectedDocPreview.uploadDate}
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
