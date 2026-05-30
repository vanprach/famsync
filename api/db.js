import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { action, familyId, email, data } = req.body;

  try {
    switch (action) {
      // Auth Lookup: Find if email is mapped to a family
      case "findFamilyByEmail": {
        if (!email) return res.status(400).json({ error: "Email is required" });
        const cleanEmail = email.toLowerCase().trim();
        const mapping = await kv.get(`famsync_email:${cleanEmail}`);
        
        if (!mapping) {
          return res.status(200).json({ result: null });
        }
        
        // Fetch the linked family details
        const family = await kv.get(`famsync_family:${mapping.familyId}`);
        if (!family) {
          return res.status(200).json({ result: null }); // Map exists but family deleted
        }
        
        const member = family.members.find(m => m.id === mapping.memberId);
        return res.status(200).json({ result: { family, member } });
      }

      // Fetch Family Profile
      case "getFamily": {
        if (!familyId) return res.status(400).json({ error: "Family ID is required" });
        const family = await kv.get(`famsync_family:${familyId}`);
        return res.status(200).json({ family });
      }

      // Save Family Profile & Link Member Gmails
      case "saveFamily": {
        if (!data || !data.id) return res.status(400).json({ error: "Family data is required" });
        
        // 1. Save family document
        await kv.set(`famsync_family:${data.id}`, data);
        
        // 2. Set index mappings for all members with Gmail addresses
        if (data.members && Array.isArray(data.members)) {
          for (const m of data.members) {
            if (m.email) {
              const cleanEmail = m.email.toLowerCase().trim();
              await kv.set(`famsync_email:${cleanEmail}`, {
                familyId: data.id,
                memberId: m.id
              });
            }
          }
        }
        
        return res.status(200).json({ success: true });
      }

      // Schedules CRUD
      case "getSchedules": {
        if (!familyId) return res.status(400).json({ error: "Family ID is required" });
        const schedules = await kv.get(`famsync_schedules:${familyId}`) || [];
        return res.status(200).json({ schedules });
      }

      case "saveSchedules": {
        if (!familyId || !data) return res.status(400).json({ error: "Family ID and schedules data required" });
        await kv.set(`famsync_schedules:${familyId}`, data);
        return res.status(200).json({ success: true });
      }

      // Trips CRUD
      case "getTrips": {
        if (!familyId) return res.status(400).json({ error: "Family ID is required" });
        const trips = await kv.get(`famsync_trips:${familyId}`) || [];
        return res.status(200).json({ trips });
      }

      case "saveTrips": {
        if (!familyId || !data) return res.status(400).json({ error: "Family ID and trips data required" });
        await kv.set(`famsync_trips:${familyId}`, data);
        return res.status(200).json({ success: true });
      }

      // Documents CRUD
      case "getDocuments": {
        if (!familyId) return res.status(400).json({ error: "Family ID is required" });
        const documents = await kv.get(`famsync_documents:${familyId}`) || [];
        return res.status(200).json({ documents });
      }

      case "saveDocuments": {
        if (!familyId || !data) return res.status(400).json({ error: "Family ID and documents data required" });
        await kv.set(`famsync_documents:${familyId}`, data);
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error("Vercel KV API Error:", err);
    return res.status(500).json({ error: "Database error occurred", details: err.message });
  }
}
