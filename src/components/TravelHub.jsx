import React, { useState } from "react";
import { Plus, Plane, Hotel, Paperclip, FileUp, Trash, ExternalLink, Edit, Check, X, Calendar } from "lucide-react";
import { translations } from "../utils/translations";
import { storageAPI, MOCK_RECEIPT_URL } from "../utils/storage";
import { audioEngine } from "../utils/audio";

export default function TravelHub({ 
  family, 
  trips, 
  documents, 
  onSaveTrip, 
  onDeleteTrip, 
  onSaveDocument, 
  lang 
}) {
  const t = translations[lang];

  const [showAddModal, setShowAddModal] = useState(false);
  
  // Trip Details Modal States
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);

  // Trip Form States (New Trip)
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  // Flight Subform (Outbound)
  const [airline, setAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  // Return Flight Subform
  const [retAirline, setRetAirline] = useState("");
  const [retFlightNumber, setRetFlightNumber] = useState("");
  const [retDepartureDate, setRetDepartureDate] = useState("");
  const [retArrivalDate, setRetArrivalDate] = useState("");
  const [retBookingRef, setRetBookingRef] = useState("");
  // Hotel Subform
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  
  const [error, setError] = useState("");

  // Edit Trip States
  const [editTripName, setEditTripName] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editAirline, setEditAirline] = useState("");
  const [editFlightNumber, setEditFlightNumber] = useState("");
  const [editDepartureDate, setEditDepartureDate] = useState("");
  const [editArrivalDate, setEditArrivalDate] = useState("");
  const [editBookingRef, setEditBookingRef] = useState("");
  const [editRetAirline, setEditRetAirline] = useState("");
  const [editRetFlightNumber, setEditRetFlightNumber] = useState("");
  const [editRetDepartureDate, setEditRetDepartureDate] = useState("");
  const [editRetArrivalDate, setEditRetArrivalDate] = useState("");
  const [editRetBookingRef, setEditRetBookingRef] = useState("");
  const [editHotelName, setEditHotelName] = useState("");
  const [editHotelAddress, setEditHotelAddress] = useState("");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editError, setEditError] = useState("");

  // Document Upload States
  const [docTitle, setDocTitle] = useState("");
  const [docMemberId, setDocMemberId] = useState(family.members[0]?.id || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const getActiveTrip = () => {
    return trips.find(t => t.id === selectedTripId) || null;
  };

  const handleCreateTrip = (e) => {
    e.preventDefault();
    if (!tripName.trim()) {
      setError(t.requiredField);
      return;
    }

    const hasFlight = airline.trim() || flightNumber.trim() || bookingRef.trim();
    const hasReturnFlight = retAirline.trim() || retFlightNumber.trim() || retBookingRef.trim();
    const hasHotel = hotelName.trim() || hotelAddress.trim() || checkIn.trim();

    const newTrip = {
      id: `trip-${Date.now()}`,
      name: tripName.trim(),
      destination: destination.trim(),
      flight: hasFlight ? {
        airline: airline.trim(),
        flightNumber: flightNumber.trim(),
        departureDate,
        arrivalDate,
        bookingRef: bookingRef.trim()
      } : null,
      returnFlight: hasReturnFlight ? {
        airline: retAirline.trim(),
        flightNumber: retFlightNumber.trim(),
        departureDate: retDepartureDate,
        arrivalDate: retArrivalDate,
        bookingRef: retBookingRef.trim()
      } : null,
      hotel: hasHotel ? {
        name: hotelName.trim(),
        address: hotelAddress.trim(),
        checkIn,
        checkOut
      } : null,
      documents: [] // Array of documents
    };

    onSaveTrip(newTrip);

    // Reset States
    setTripName("");
    setDestination("");
    setAirline("");
    setFlightNumber("");
    setDepartureDate("");
    setArrivalDate("");
    setBookingRef("");
    setRetAirline("");
    setRetFlightNumber("");
    setRetDepartureDate("");
    setRetArrivalDate("");
    setRetBookingRef("");
    setHotelName("");
    setHotelAddress("");
    setCheckIn("");
    setCheckOut("");
    setShowAddModal(false);
    setError("");
  };

  const handleStartEdit = (trip) => {
    audioEngine.playSFX("click");
    setEditTripName(trip.name);
    setEditDestination(trip.destination || "");
    setEditAirline(trip.flight?.airline || "");
    setEditFlightNumber(trip.flight?.flightNumber || "");
    setEditDepartureDate(trip.flight?.departureDate || "");
    setEditArrivalDate(trip.flight?.arrivalDate || "");
    setEditBookingRef(trip.flight?.bookingRef || "");
    setEditRetAirline(trip.returnFlight?.airline || "");
    setEditRetFlightNumber(trip.returnFlight?.flightNumber || "");
    setEditRetDepartureDate(trip.returnFlight?.departureDate || "");
    setEditRetArrivalDate(trip.returnFlight?.arrivalDate || "");
    setEditRetBookingRef(trip.returnFlight?.bookingRef || "");
    setEditHotelName(trip.hotel?.name || "");
    setEditHotelAddress(trip.hotel?.address || "");
    setEditCheckIn(trip.hotel?.checkIn || "");
    setEditCheckOut(trip.hotel?.checkOut || "");
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTripName.trim()) {
      setEditError(t.requiredField);
      return;
    }

    const activeTrip = getActiveTrip();
    const hasFlight = editAirline.trim() || editFlightNumber.trim() || editBookingRef.trim();
    const hasReturnFlight = editRetAirline.trim() || editRetFlightNumber.trim() || editRetBookingRef.trim();
    const hasHotel = editHotelName.trim() || editHotelAddress.trim() || editCheckIn.trim();

    const updatedTrip = {
      ...activeTrip,
      name: editTripName.trim(),
      destination: editDestination.trim(),
      flight: hasFlight ? {
        airline: editAirline.trim(),
        flightNumber: editFlightNumber.trim(),
        departureDate: editDepartureDate,
        arrivalDate: editArrivalDate,
        bookingRef: editBookingRef.trim()
      } : null,
      returnFlight: hasReturnFlight ? {
        airline: editRetAirline.trim(),
        flightNumber: editRetFlightNumber.trim(),
        departureDate: editRetDepartureDate,
        arrivalDate: editRetArrivalDate,
        bookingRef: editRetBookingRef.trim()
      } : null,
      hotel: hasHotel ? {
        name: editHotelName.trim(),
        address: editHotelAddress.trim(),
        checkIn: editCheckIn,
        checkOut: editCheckOut
      } : null
    };

    onSaveTrip(updatedTrip);
    setIsEditing(false);
    setEditError("");
  };

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

    const activeTrip = getActiveTrip();
    if (!activeTrip) return;

    setIsUploading(true);
    const docId = `doc-${Date.now()}`;
    const fileName = uploadedFileName || "boarding_pass.png";

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

    // Save document globally
    await onSaveDocument(newDoc);

    // Link document directly to this trip
    const updatedTrip = {
      ...activeTrip,
      documents: [...(activeTrip.documents || []), newDoc]
    };
    await onSaveTrip(updatedTrip);

    // Reset Upload States
    setDocTitle("");
    setSelectedFile(null);
    setUploadedFileName("");
    setUploadError("");
    setIsUploading(false);
  };

  // Helper to map old document ID strings to full objects, supporting retro compatibility
  const getTripDocuments = (tripDocs) => {
    if (!tripDocs) return [];
    return tripDocs.map(d => {
      if (typeof d === "string") {
        return documents.find(doc => doc.id === d) || { id: d, title: "Document", fileName: "attachment.png", fileUrl: MOCK_RECEIPT_URL, uploadDate: "2026-05-30" };
      }
      return d;
    }).filter(Boolean);
  };

  const getMember = (id) => {
    return family.members.find(m => m.id === id) || {};
  };

  const handleOpenDetails = (trip) => {
    audioEngine.playSFX("click");
    setSelectedTripId(trip.id);
    setIsEditing(false);
  };

  const activeTrip = getActiveTrip();

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
          onClick={() => { audioEngine.playSFX("click"); setShowAddModal(true); }} 
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {trips.map(trip => (
            <div 
              key={trip.id} 
              onClick={() => handleOpenDetails(trip)}
              className="glass-panel trip-card" 
              style={{ padding: "20px", cursor: "pointer" }}
            >
              <div className="trip-header" style={{ border: "none", marginBottom: 0, paddingBottom: 0 }}>
                <h3 style={{ fontSize: "17px", fontWeight: "700" }}>
                  ✈️ {trip.name}
                  {trip.destination && <span style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>📍 {trip.destination}</span>}
                </h3>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                {trip.flight && <span style={{ background: "rgba(59, 130, 246, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>🛫 {lang === "he" ? "הלוך" : "Outbound"}</span>}
                {trip.returnFlight && <span style={{ background: "rgba(139, 92, 246, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>🛬 {lang === "he" ? "חזור" : "Return"}</span>}
                {trip.hotel && <span style={{ background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>🏨 {lang === "he" ? "מלון" : "Hotel"}</span>}
              </div>
              
              <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
                {trip.documents ? `${trip.documents.length} ${lang === "he" ? "מסמכים מצורפים" : "documents linked"}` : (lang === "he" ? "אין מסמכים" : "No docs")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Trip Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plane size={20} color="var(--primary)" />
              {t.addTrip}
            </h3>

            <form onSubmit={handleCreateTrip}>
              {/* Trip Title & Destination */}
              <div className="grid-cols-2">
                <div className="form-group">
                  <label>{t.tripName}</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={tripName}
                    onChange={(e) => { setTripName(e.target.value); setError(""); }}
                    placeholder={lang === "he" ? "חופשה משפחתית באילת" : "Family Vacation"}
                  />
                  {error && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{error}</span>}
                </div>
                <div className="form-group">
                  <label>{lang === "he" ? "יעד" : "Destination"}</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={lang === "he" ? "יוון, אילת, פריז" : "Greece, Paris..."}
                  />
                </div>
              </div>

              {/* Outbound Flights segment */}
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", color: "var(--info)" }}>
                  <Plane size={16} />
                  🛫 {lang === "he" ? "טיסת הלוך" : "Outbound Flight"}
                </h4>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>{t.airline}</label>
                    <input type="text" className="form-input" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="El Al, Ryanair..." />
                  </div>
                  <div className="form-group">
                    <label>{t.flightNumber}</label>
                    <input type="text" className="form-input" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="LY-381" />
                  </div>
                </div>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>{t.departureDate}</label>
                    <input type="datetime-local" className="form-input" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>{t.arrivalDate}</label>
                    <input type="datetime-local" className="form-input" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{t.bookingRef}</label>
                  <input type="text" className="form-input" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} placeholder="Booking Code / PNR" />
                </div>
              </div>

              {/* Return Flights segment */}
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)" }}>
                  <Plane size={16} />
                  🛬 {lang === "he" ? "טיסה חזור" : "Return Flight"}
                </h4>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>{t.airline}</label>
                    <input type="text" className="form-input" value={retAirline} onChange={(e) => setRetAirline(e.target.value)} placeholder="El Al, Ryanair..." />
                  </div>
                  <div className="form-group">
                    <label>{t.flightNumber}</label>
                    <input type="text" className="form-input" value={retFlightNumber} onChange={(e) => setRetFlightNumber(e.target.value)} placeholder="LY-382" />
                  </div>
                </div>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>{t.departureDate}</label>
                    <input type="datetime-local" className="form-input" value={retDepartureDate} onChange={(e) => setRetDepartureDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>{t.arrivalDate}</label>
                    <input type="datetime-local" className="form-input" value={retArrivalDate} onChange={(e) => setRetArrivalDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{t.bookingRef}</label>
                  <input type="text" className="form-input" value={retBookingRef} onChange={(e) => setRetBookingRef(e.target.value)} placeholder="Booking Code / PNR" />
                </div>
              </div>

              {/* Hotel fields */}
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", color: "var(--success)" }}>
                  <Hotel size={16} />
                  {t.hotelSection}
                </h4>
                <div className="form-group">
                  <label>{t.hotelName}</label>
                  <input type="text" className="form-input" value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="Hilton, Cozy Airbnb..." />
                </div>
                <div className="form-group">
                  <label>{t.hotelAddress}</label>
                  <input type="text" className="form-input" value={hotelAddress} onChange={(e) => setHotelAddress(e.target.value)} />
                </div>
                <div className="grid-cols-2" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label>{t.checkIn}</label>
                    <input type="date" className="form-input" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>{t.checkOut}</label>
                    <input type="date" className="form-input" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  {t.cancel}
                </button>
                <button type="submit" className="btn-primary">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Trip details modal page */}
      {activeTrip && (
        <div className="modal-overlay" onClick={() => setSelectedTripId(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <span className="smart-badge flight">📍 {lang === "he" ? "אירוע נסיעה" : "Travel Event"}</span>
                <h3 style={{ fontSize: "22px", fontWeight: "800", marginTop: "8px" }}>{activeTrip.name}</h3>
                {activeTrip.destination && <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>📍 {activeTrip.destination}</span>}
              </div>
              <button 
                onClick={() => setSelectedTripId(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {isEditing ? (
              // EDIT FORM inside Details Modal
              <form onSubmit={handleSaveEdit}>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>{t.tripName}</label>
                    <input type="text" className="form-input" value={editTripName} onChange={(e) => { setEditTripName(e.target.value); setEditError(""); }} />
                    {editError && <span style={{ color: "var(--danger)", fontSize: "12px" }}>{editError}</span>}
                  </div>
                  <div className="form-group">
                    <label>{lang === "he" ? "יעד" : "Destination"}</label>
                    <input type="text" className="form-input" value={editDestination} onChange={(e) => setEditDestination(e.target.value)} />
                  </div>
                </div>

                {/* Edit Outbound Flight */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", color: "var(--info)" }}>
                    🛫 {lang === "he" ? "ערוך טיסה הלוך" : "Edit Outbound Flight"}
                  </h4>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>{t.airline}</label>
                      <input type="text" className="form-input" value={editAirline} onChange={(e) => setEditAirline(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.flightNumber}</label>
                      <input type="text" className="form-input" value={editFlightNumber} onChange={(e) => setEditFlightNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>{t.departureDate}</label>
                      <input type="datetime-local" className="form-input" value={editDepartureDate} onChange={(e) => setEditDepartureDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.arrivalDate}</label>
                      <input type="datetime-local" className="form-input" value={editArrivalDate} onChange={(e) => setEditArrivalDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t.bookingRef}</label>
                    <input type="text" className="form-input" value={editBookingRef} onChange={(e) => setEditBookingRef(e.target.value)} />
                  </div>
                </div>

                {/* Edit Return Flight */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", color: "var(--primary)" }}>
                    🛬 {lang === "he" ? "ערוך טיסה חזור" : "Edit Return Flight"}
                  </h4>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>{t.airline}</label>
                      <input type="text" className="form-input" value={editRetAirline} onChange={(e) => setEditRetAirline(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.flightNumber}</label>
                      <input type="text" className="form-input" value={editRetFlightNumber} onChange={(e) => setEditRetFlightNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>{t.departureDate}</label>
                      <input type="datetime-local" className="form-input" value={editRetDepartureDate} onChange={(e) => setEditRetDepartureDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.arrivalDate}</label>
                      <input type="datetime-local" className="form-input" value={editRetArrivalDate} onChange={(e) => setEditRetArrivalDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>{t.bookingRef}</label>
                    <input type="text" className="form-input" value={editRetBookingRef} onChange={(e) => setEditRetBookingRef(e.target.value)} />
                  </div>
                </div>

                {/* Edit Hotel details */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", color: "var(--success)" }}>
                    🏨 {t.hotelSection}
                  </h4>
                  <div className="form-group">
                    <label>{t.hotelName}</label>
                    <input type="text" className="form-input" value={editHotelName} onChange={(e) => setEditHotelName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>{t.hotelAddress}</label>
                    <input type="text" className="form-input" value={editHotelAddress} onChange={(e) => setEditHotelAddress(e.target.value)} />
                  </div>
                  <div className="grid-cols-2" style={{ marginBottom: 0 }}>
                    <div className="form-group">
                      <label>{t.checkIn}</label>
                      <input type="date" className="form-input" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.checkOut}</label>
                      <input type="date" className="form-input" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
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
                
                {/* Outbound Flight Segment */}
                {activeTrip.flight ? (
                  <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.15)", marginBottom: "16px", fontSize: "14px" }}>
                    <h4 style={{ fontWeight: "700", color: "var(--info)", marginBottom: "8px" }}>🛫 {lang === "he" ? "טיסת הלוך" : "Outbound Flight"}</h4>
                    <div className="grid-cols-2" style={{ gap: "8px" }}>
                      <div><strong>{t.airline}:</strong> {activeTrip.flight.airline}</div>
                      <div><strong>{t.flightNumber}:</strong> {activeTrip.flight.flightNumber}</div>
                      {activeTrip.flight.departureDate && <div><strong>{lang === "he" ? "המראה:" : "Departure:"}</strong> {new Date(activeTrip.flight.departureDate).toLocaleString(lang === "he" ? "he" : "en-US", {dateStyle:"short", timeStyle:"short"})}</div>}
                      {activeTrip.flight.arrivalDate && <div><strong>{lang === "he" ? "נחיתה:" : "Landing:"}</strong> {new Date(activeTrip.flight.arrivalDate).toLocaleString(lang === "he" ? "he" : "en-US", {dateStyle:"short", timeStyle:"short"})}</div>}
                      <div><strong>{t.bookingRef}:</strong> <span style={{ color: "var(--info)", fontWeight: "bold" }}>{activeTrip.flight.bookingRef}</span></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px", border: "1px dashed var(--border-glass)", borderRadius: "12px", color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
                    {lang === "he" ? "אין פרטי טיסת הלוך. ערוך להזנת פרטים." : "No outbound flight listed."}
                  </div>
                )}

                {/* Return Flight Segment */}
                {activeTrip.returnFlight ? (
                  <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.15)", marginBottom: "16px", fontSize: "14px" }}>
                    <h4 style={{ fontWeight: "700", color: "var(--primary)", marginBottom: "8px" }}>🛬 {lang === "he" ? "טיסה חזור" : "Return Flight"}</h4>
                    <div className="grid-cols-2" style={{ gap: "8px" }}>
                      <div><strong>{t.airline}:</strong> {activeTrip.returnFlight.airline}</div>
                      <div><strong>{t.flightNumber}:</strong> {activeTrip.returnFlight.flightNumber}</div>
                      {activeTrip.returnFlight.departureDate && <div><strong>{lang === "he" ? "המראה חזור:" : "Return Departure:"}</strong> {new Date(activeTrip.returnFlight.departureDate).toLocaleString(lang === "he" ? "he" : "en-US", {dateStyle:"short", timeStyle:"short"})}</div>}
                      {activeTrip.returnFlight.arrivalDate && <div><strong>{lang === "he" ? "נחיתה בארץ:" : "Return Landing:"}</strong> {new Date(activeTrip.returnFlight.arrivalDate).toLocaleString(lang === "he" ? "he" : "en-US", {dateStyle:"short", timeStyle:"short"})}</div>}
                      <div><strong>{t.bookingRef}:</strong> <span style={{ color: "var(--primary)", fontWeight: "bold" }}>{activeTrip.returnFlight.bookingRef}</span></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px", border: "1px dashed var(--border-glass)", borderRadius: "12px", color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
                    {lang === "he" ? "אין פרטי טיסת חזור. ערוך להזנת פרטים." : "No return flight details listed."}
                  </div>
                )}

                {/* Hotel Segment */}
                {activeTrip.hotel ? (
                  <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", marginBottom: "16px", fontSize: "14px" }}>
                    <h4 style={{ fontWeight: "700", color: "var(--success)", marginBottom: "8px" }}>🏨 {t.hotelSection}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div><strong>{t.hotelName}:</strong> {activeTrip.hotel.name}</div>
                      {activeTrip.hotel.address && <div><strong>{t.hotelAddress}:</strong> {activeTrip.hotel.address}</div>}
                      <div><strong>{t.checkIn}:</strong> {activeTrip.hotel.checkIn} | <strong>{t.checkOut}:</strong> {activeTrip.hotel.checkOut}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px", border: "1px dashed var(--border-glass)", borderRadius: "12px", color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
                    {lang === "he" ? "אין פרטי מלון מעודכנים. ערוך להזנת פרטים." : "No hotel details listed."}
                  </div>
                )}

                {/* Documents List & Inline Uploader */}
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-glass)" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Paperclip size={14} />
                    {t.documentsAttached} ({(activeTrip.documents && activeTrip.documents.length) || 0})
                  </h4>

                  {/* Render document list */}
                  <div className="inline-docs-container">
                    {getTripDocuments(activeTrip.documents).map(doc => (
                      <div key={doc.id} className="inline-doc-item">
                        <span style={{ fontWeight: "600" }}>{doc.title}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>({doc.fileName})</span>
                          <button 
                            onClick={() => setSelectedDocPreview(doc)} 
                            className="inline-doc-link"
                          >
                            <ExternalLink size={12} />
                            {lang === "he" ? "הצג" : "View"}
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!activeTrip.documents || activeTrip.documents.length === 0) && (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {lang === "he" ? "אין מסמכים מצורפים לנסיעה זו" : "No documents attached to this trip"}
                      </span>
                    )}
                  </div>

                  {/* Uploader Form */}
                  <form onSubmit={handleSaveDocument} style={{ marginTop: "16px", padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border-glass)", borderRadius: "8px" }}>
                    <h5 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
                      {lang === "he" ? "העלאת כרטיסי טיסה או שוברים לנסיעה" : "Upload boarding passes/tickets to this trip"}
                    </h5>
                    
                    <div className="grid-cols-2" style={{ gap: "8px", marginBottom: "10px" }}>
                      <input 
                        type="text" 
                        placeholder={lang === "he" ? "כותרת (למשל: כרטיס טיסה הלוך)" : "Title (e.g. Flight ticket)"}
                        className="form-input" 
                        style={{ padding: "8px 12px", fontSize: "13px" }}
                        value={docTitle}
                        onChange={(e) => { setDocTitle(e.target.value); setUploadError(""); }}
                      />
                      
                      <label className="btn-secondary" style={{ padding: "8px 12px", fontSize: "13px", cursor: "pointer", display: "inline-flex" }}>
                        <FileUp size={12} />
                        {uploadedFileName ? (uploadedFileName.slice(0, 10) + "...") : (lang === "he" ? "בחר קובץ" : "Choose File")}
                        <input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          className="file-upload-input" 
                          onChange={handleFileUpload} 
                        />
                      </label>
                    </div>
                    {uploadError && <div style={{ color: "var(--danger)", fontSize: "11px", marginBottom: "6px" }}>{uploadError}</div>}
                    
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ width: "100%", padding: "8px", fontSize: "13px", borderRadius: "6px" }}
                      disabled={isUploading}
                    >
                      {isUploading ? (lang === "he" ? "מעלה..." : "Uploading...") : (lang === "he" ? "צרף מסמך" : "Attach Document")}
                    </button>
                  </form>
                </div>

                {/* Footer buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
                  <button 
                    onClick={() => {
                      const confirmDel = window.confirm(lang === "he" ? "למחוק את הנסיעה הזו?" : "Delete this trip?");
                      if (confirmDel) {
                        onDeleteTrip(activeTrip.id);
                        setSelectedTripId(null);
                      }
                    }}
                    className="btn-text" 
                    style={{ color: "var(--danger)" }}
                  >
                    <Trash size={16} />
                    {t.deleteBtn}
                  </button>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handleStartEdit(activeTrip)} className="btn-secondary" style={{ padding: "8px 16px" }}>
                      <Edit size={14} />
                      {t.editBtn}
                    </button>
                    <button onClick={() => setSelectedTripId(null)} className="btn-primary" style={{ padding: "8px 16px" }}>
                      {lang === "he" ? "סגור" : "Close"}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Document Preview Modal */}
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
