import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false, // Disables body parsing to allow direct streaming of binary data
  },
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Filename");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const filename = req.headers["x-filename"] || `upload-${Date.now()}.png`;
  const contentType = req.headers["content-type"] || "image/png";

  try {
    // Stream request body directly into Vercel Blob
    const blob = await put(filename, req, {
      access: "public",
      contentType: contentType,
    });

    return res.status(200).json(blob);
  } catch (err) {
    console.error("Vercel Blob Upload Error:", err);
    return res.status(500).json({ error: "Failed to upload file to Vercel Blob", details: err.message });
  }
}
