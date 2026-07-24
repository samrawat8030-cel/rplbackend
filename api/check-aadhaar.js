const { google } = require("googleapis");
const formidable = require("formidable");
require("dotenv").config();

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(400).json({ success: false, message: "Invalid form data" });
    }

    try {
      const normalizedAdhaar = String(fields.adhaar || "").trim();

      if (!normalizedAdhaar) {
        return res.status(400).json({
          success: false,
          errorCode: "AADHAAR_REQUIRED",
          message: "Aadhaar number is required for validation.",
          userMessage: "Please provide a valid Aadhaar number to check for duplicates.",
        });
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: "service_account",
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: process.env.GOOGLE_AUTH_URI,
          token_uri: process.env.GOOGLE_TOKEN_URI,
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/rpl-league%40rpl-league.iam.gserviceaccount.com",
          universe_domain: "googleapis.com",
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth });
      const existingAdhaarResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!G:G",
      });

      const existingAdhaars = (existingAdhaarResponse.data.values || [])
        .flat()
        .map((value) => String(value).trim());

      if (existingAdhaars.includes(normalizedAdhaar)) {
        return res.status(409).json({
          success: false,
          errorCode: "AADHAAR_DUPLICATE",
          message: "This Aadhaar number is already registered.",
          userMessage: "Aadhaar number already exists in our records.",
          exists: true,
        });
      }

      return res.status(200).json({
        success: true,
        exists: false,
        message: "Aadhaar number is not found in the sheet.",
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });
};
