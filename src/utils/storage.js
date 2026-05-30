// Hybrid Client-Side Database Layer with Offline LocalStorage fallback

const STORAGE_KEYS = {
  FAMILIES: "famsync_families",
  CURRENT_USER: "famsync_current_user",
  SCHEDULES: "famsync_schedules",
  TRIPS: "famsync_trips",
  DOCUMENTS: "famsync_documents"
};

const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
];

const MOCK_RECEIPT_URL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'><rect width='100%' height='100%' fill='%231a1a2e'/><text x='20' y='50' fill='%23ffffff' font-family='sans-serif' font-size='24' font-weight='bold'>FamSync Receipt Simulator</text><line x1='20' y1='80' x2='380' y2='80' stroke='%23ffffff' stroke-width='2'/><text x='20' y='120' fill='%23a2a2d0' font-family='sans-serif' font-size='14'>Merchant: Country Gym %26 Spa</text><text x='20' y='140' fill='%23a2a2d0' font-family='sans-serif' font-size='14'>Date: 2026-05-28</text><text x='20' y='160' fill='%23a2a2d0' font-family='sans-serif' font-size='14'>Member: Avi Cohen</text><text x='20' y='220' fill='%23ffffff' font-family='sans-serif' font-size='18' font-weight='bold'>Description</text><text x='320' y='220' fill='%23ffffff' font-family='sans-serif' font-size='18' font-weight='bold' text-anchor='end'>Amount</text><line x1='20' y1='235' x2='380' y2='235' stroke='%23444466' stroke-width='1'/><text x='20' y='270' fill='%23ffffff' font-family='sans-serif' font-size='16'>Monthly Yoga Membership</text><text x='320' y='270' fill='%23ffffff' font-family='sans-serif' font-size='16' text-anchor='end'>₪350.00</text><text x='20' y='300' fill='%23ffffff' font-family='sans-serif' font-size='16'>Kid Swimming Course (Dan)</text><text x='320' y='300' fill='%23ffffff' font-family='sans-serif' font-size='16' text-anchor='end'>₪450.00</text><line x1='20' y1='450' x2='380' y2='450' stroke='%23ffffff' stroke-width='2'/><text x='20' y='490' fill='%23ffffff' font-family='sans-serif' font-size='20' font-weight='bold'>Total Paid</text><text x='320' y='490' fill='%2322c55e' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='end'>₪800.00</text><text x='20' y='570' fill='%23a2a2d0' font-family='sans-serif' font-size='12' text-anchor='middle'>Thank you for using FamSync Vault</text></svg>";

// Helper to make API requests to Vercel KV serverless handler
const callAPI = async (action, payload = {}) => {
  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action, ...payload })
    });
    if (!res.ok) throw new Error("API call failed");
    return await res.json();
  } catch (err) {
    // Return null to signal API is offline/not responding
    return null;
  }
};

export const storageAPI = {
  // Sync wrapper for initial fast state hydration (from localStorage cache)
  getLocalBackup(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  },

  setLocalBackup(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Failed to set local backup:", e);
    }
  },

  // Auth User
  getCurrentUser() {
    return this.getLocalBackup(STORAGE_KEYS.CURRENT_USER);
  },

  setCurrentUser(user) {
    this.setLocalBackup(STORAGE_KEYS.CURRENT_USER, user);
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Dynamic Auth Lookup
  async findFamilyByMemberEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    
    // 1. Try Vercel KV Database API
    const response = await callAPI("findFamilyByEmail", { email: cleanEmail });
    if (response && response.result !== undefined) {
      return response.result;
    }

    // 2. Fallback to Local Storage
    const families = this.getLocalBackup(STORAGE_KEYS.FAMILIES, []);
    for (const fam of families) {
      const match = fam.members.find(m => m.email && m.email.toLowerCase().trim() === cleanEmail);
      if (match) {
        return { family: fam, member: match };
      }
    }
    return null;
  },

  // Fetch Family details
  async getFamily(familyId) {
    if (!familyId) return null;

    // 1. Try Vercel KV
    const response = await callAPI("getFamily", { familyId });
    if (response && response.family) {
      // Keep local cache updated
      const families = this.getLocalBackup(STORAGE_KEYS.FAMILIES, []);
      const idx = families.findIndex(f => f.id === familyId);
      if (idx >= 0) families[idx] = response.family;
      else families.push(response.family);
      this.setLocalBackup(STORAGE_KEYS.FAMILIES, families);
      return response.family;
    }

    // 2. Fallback to Local Storage
    const families = this.getLocalBackup(STORAGE_KEYS.FAMILIES, []);
    return families.find(f => f.id === familyId) || null;
  },

  // Save Family
  async saveFamily(family) {
    if (!family) return;

    // Local save
    const families = this.getLocalBackup(STORAGE_KEYS.FAMILIES, []);
    const idx = families.findIndex(f => f.id === family.id);
    if (idx >= 0) families[idx] = family;
    else families.push(family);
    this.setLocalBackup(STORAGE_KEYS.FAMILIES, families);

    // Vercel KV save
    await callAPI("saveFamily", { data: family });
  },

  // Schedules
  async getSchedules(familyId) {
    if (!familyId) return [];

    const response = await callAPI("getSchedules", { familyId });
    if (response && response.schedules) {
      const localSchedules = this.getLocalBackup(STORAGE_KEYS.SCHEDULES, {});
      localSchedules[familyId] = response.schedules;
      this.setLocalBackup(STORAGE_KEYS.SCHEDULES, localSchedules);
      return response.schedules;
    }

    const localSchedules = this.getLocalBackup(STORAGE_KEYS.SCHEDULES, {});
    return localSchedules[familyId] || [];
  },

  async saveScheduleItem(familyId, item) {
    if (!familyId) return;
    const current = await this.getSchedules(familyId);
    const index = current.findIndex(s => s.id === item.id);
    if (index >= 0) current[index] = item;
    else current.push(item);

    // Save local
    const localSchedules = this.getLocalBackup(STORAGE_KEYS.SCHEDULES, {});
    localSchedules[familyId] = current;
    this.setLocalBackup(STORAGE_KEYS.SCHEDULES, localSchedules);

    // Save Vercel KV
    await callAPI("saveSchedules", { familyId, data: current });
  },

  async deleteScheduleItem(familyId, itemId) {
    if (!familyId) return;
    const current = await this.getSchedules(familyId);
    const updated = current.filter(s => s.id !== itemId);

    // Save local
    const localSchedules = this.getLocalBackup(STORAGE_KEYS.SCHEDULES, {});
    localSchedules[familyId] = updated;
    this.setLocalBackup(STORAGE_KEYS.SCHEDULES, localSchedules);

    // Save Vercel KV
    await callAPI("saveSchedules", { familyId, data: updated });
  },

  // Trips
  async getTrips(familyId) {
    if (!familyId) return [];

    const response = await callAPI("getTrips", { familyId });
    if (response && response.trips) {
      const localTrips = this.getLocalBackup(STORAGE_KEYS.TRIPS, {});
      localTrips[familyId] = response.trips;
      this.setLocalBackup(STORAGE_KEYS.TRIPS, localTrips);
      return response.trips;
    }

    const localTrips = this.getLocalBackup(STORAGE_KEYS.TRIPS, {});
    return localTrips[familyId] || [];
  },

  async saveTrip(familyId, trip) {
    if (!familyId) return;
    const current = await this.getTrips(familyId);
    const index = current.findIndex(t => t.id === trip.id);
    if (index >= 0) current[index] = trip;
    else current.push(trip);

    // Save local
    const localTrips = this.getLocalBackup(STORAGE_KEYS.TRIPS, {});
    localTrips[familyId] = current;
    this.setLocalBackup(STORAGE_KEYS.TRIPS, localTrips);

    // Save Vercel KV
    await callAPI("saveTrips", { familyId, data: current });
  },

  async deleteTrip(familyId, tripId) {
    if (!familyId) return;
    const current = await this.getTrips(familyId);
    const updated = current.filter(t => t.id !== tripId);

    // Save local
    const localTrips = this.getLocalBackup(STORAGE_KEYS.TRIPS, {});
    localTrips[familyId] = updated;
    this.setLocalBackup(STORAGE_KEYS.TRIPS, localTrips);

    // Save Vercel KV
    await callAPI("saveTrips", { familyId, data: updated });
  },

  // Documents
  async getDocuments(familyId) {
    if (!familyId) return [];

    const response = await callAPI("getDocuments", { familyId });
    if (response && response.documents) {
      const localDocs = this.getLocalBackup(STORAGE_KEYS.DOCUMENTS, {});
      localDocs[familyId] = response.documents;
      this.setLocalBackup(STORAGE_KEYS.DOCUMENTS, localDocs);
      return response.documents;
    }

    const localDocs = this.getLocalBackup(STORAGE_KEYS.DOCUMENTS, {});
    return localDocs[familyId] || [];
  },

  async saveDocument(familyId, doc) {
    if (!familyId) return;
    const current = await this.getDocuments(familyId);
    const index = current.findIndex(d => d.id === doc.id);
    if (index >= 0) current[index] = doc;
    else current.push(doc);

    // Save local
    const localDocs = this.getLocalBackup(STORAGE_KEYS.DOCUMENTS, {});
    localDocs[familyId] = current;
    this.setLocalBackup(STORAGE_KEYS.DOCUMENTS, localDocs);

    // Save Vercel KV
    await callAPI("saveDocuments", { familyId, data: current });
  },

  async deleteDocument(familyId, docId) {
    if (!familyId) return;
    const current = await this.getDocuments(familyId);
    const updated = current.filter(d => d.id !== docId);

    // Save local
    const localDocs = this.getLocalBackup(STORAGE_KEYS.DOCUMENTS, {});
    localDocs[familyId] = updated;
    this.setLocalBackup(STORAGE_KEYS.DOCUMENTS, localDocs);

    // Save Vercel KV
    await callAPI("saveDocuments", { familyId, data: updated });
  },

  // Cloud file uploader streaming to Vercel Blob
  async uploadDocumentFile(file) {
    if (!file) return null;

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "X-Filename": encodeURIComponent(file.name),
          "Content-Type": file.type
        },
        body: file // Sends raw binary file
      });
      if (!res.ok) throw new Error("Upload request failed");
      const blob = await res.json();
      return blob.url; // Returns the public cloud URL from Vercel Blob
    } catch (err) {
      console.warn("Vercel Blob failed. Falling back to Base64:", err);
      // Fallback: Convert to Base64 for local storage testing
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  }
};

// Initial Seed Data Setup for first startup offline
const initLocalBackup = () => {
  if (!localStorage.getItem(STORAGE_KEYS.FAMILIES)) {
    const SEED_FAMILIES = [
      {
        id: "cohen-family-123",
        name: "כהן (Cohen)",
        color: "#6366f1",
        members: [
          { id: "member-avi", name: "אבי (Avi)", role: "parent", email: "avi@gmail.com", color: "#3b82f6", avatar: MOCK_AVATARS[1] },
          { id: "member-sarit", name: "שרית (Sarit)", role: "parent", email: "sarit@gmail.com", color: "#ec4899", avatar: MOCK_AVATARS[0] },
          { id: "member-dan", name: "דן (Dan)", role: "kid", email: "", color: "#f59e0b", avatar: MOCK_AVATARS[2] },
          { id: "member-maya", name: "מיה (Maya)", role: "kid", email: "", color: "#10b981", avatar: MOCK_AVATARS[3] }
        ]
      }
    ];
    localStorage.setItem(STORAGE_KEYS.FAMILIES, JSON.stringify(SEED_FAMILIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
    const SEED_SCHEDULES = {
      "cohen-family-123": [
        { id: "sch-1", title: "יוגה (Yoga Course)", memberId: "member-avi", day: "Sunday", startTime: "08:00", endTime: "09:30", isRecurring: true, type: "parent" },
        { id: "sch-2", title: "אימון כושר (Gym Workout)", memberId: "member-sarit", day: "Tuesday", startTime: "19:00", endTime: "20:30", isRecurring: true, type: "parent" },
        { id: "sch-3", title: "חוג שחייה (Swimming Class)", memberId: "member-dan", day: "Monday", startTime: "16:30", endTime: "17:30", isRecurring: true, type: "kid" },
        { id: "sch-4", title: "שיעור פסנתר (Piano Lesson)", memberId: "member-maya", day: "Wednesday", startTime: "15:00", endTime: "16:00", isRecurring: true, type: "kid" },
        { id: "sch-5", title: "אימון כדורגל (Soccer Practice)", memberId: "member-dan", day: "Thursday", startTime: "17:00", endTime: "18:30", isRecurring: true, type: "kid" }
      ]
    };
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(SEED_SCHEDULES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRIPS)) {
    const SEED_TRIPS = {
      "cohen-family-123": [
        {
          id: "trip-1",
          name: "חופשת קיץ ביוון (Summer Greece)",
          flight: { airline: "Bluebird Airways", flightNumber: "BB-231", departureDate: "2026-07-15T06:30", arrivalDate: "2026-07-15T08:45", bookingRef: "GR8291A" },
          hotel: { name: "Crete Paradise Resort", address: "Main Street 44, Crete, Greece", checkIn: "2026-07-15", checkOut: "2026-07-22" },
          documents: ["doc-1"]
        }
      ]
    };
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(SEED_TRIPS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
    const SEED_DOCUMENTS = {
      "cohen-family-123": [
        { id: "doc-1", title: "קבלה עבור אימון כושר ויוגה משפחתי", category: "travel", memberId: "member-avi", fileName: "gym_receipt_2026.png", fileUrl: MOCK_RECEIPT_URL, uploadDate: "2026-05-28" }
      ]
    };
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(SEED_DOCUMENTS));
  }
};

initLocalBackup();
export { MOCK_AVATARS, MOCK_RECEIPT_URL };
