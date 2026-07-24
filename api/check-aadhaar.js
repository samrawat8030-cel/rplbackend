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
          private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDclGozezXnAHAz\n2HSJYeSnbiO4DLC+Ssijskl6G7+Q7edHhw3FjjTH7EkwQGdxDCTnW8CO3CCMt8G5\nzA1yD4Psgf0v4gwR8HkJAT6Kn3jZx/JntD+AbQCmmI+lgCCZuVUmGSjElLlAJxgU\nhAEAXUP9K0BnOdl5xig6A8cH5OMhYm6HtI+49py8juSfIjm7Ii1zdUNa2FXj4Ki6\nOEw80rPRyQdEfAQnhktzIIda+/L9y81fPE6XeW5A7DKxRU1eIhzdzmVgIozHVwo8\nVcyPFdIj/035aP+S9kIm3IDFm7JDLvN7qKisc3SpCdXny082TCTGTJrzqlYrtHot\nmBHlovY5AgMBAAECggEABinIHTUhne6SCVjQdMWSn9JWLCkqnRPg2aC8fdgdo6ff\nZk0R55sKwtVJfDrTHm0CRkv21ucJVR/jSVTiwUpJW4fhnP9kv/GR/Ybr35qyGT+w\nIxFTFDxiIBreKffTsV06JwIynz+FPOjQEEQEn8/QplfEM74sOJipUhRTRiyxOKMG\nqPBe8ytuD5sHq/ZN4Bi7h99QIwVTk9/B+XPVj/4UdHRvPWNokN0sFd7vus/pjXus\ngg0L2VJZbfiKA/fHNO2XwDEmgfZjUhEeZSY+P70R4yQEAAp5UAXw1Qp/Nv0D6L0n\ntr+FipFDgsrSDtbJqKDenCwQvEllPx61P6yCd8LVYwKBgQD0qXCHrxR5Cb+KYLAK\ncd8GrHgRR5Rq2AJJM71mtXoTVBo2vk+MXAfjdURt0qsZfThFlqJ4bzMcr7uxZ3Fv\nBA+EGFELWy4WUyBGYspGNnNDDCNrTl0yNdU+SYdRno6u8sMqX6Wf939AmwjN4Lru\n7wVx1nf1nAucvDcsT9ZWpql3uwKBgQDmzUaKQhO8nPcEdBYr3/oEdvOAXTPB3rxa\nRtPC/6Ybjt7hC6PjYXez69KCX0mZTSTs4BR61rgm4gXAPqYm/xz2s5ve0KkR8WQ0\ns7uPk2CCJ8ldhcTxescwgqwI/R/ydLDIxgA+fqUcfYT0gMJv4MY8DZV37WwihH1G\noukosjLomwKBgQDg0eqD5BBOAPUvdRWPI4Aro8RZLItnesLu/Upn3Q8mP7wu3cY/\nVjoxe4q72EA9leFloLv/Kz+udpVkuYd02ihf2/BtHQZGoXAg/Zqd1l8oFzlc24+s\nGeev6uUbzTWT8aQBhg6t5kHa3hvDA2UDNkSsjMWCvje1eQbCA0MUMOW9DQKBgBtH\nc+jvemm2m7OZDO3OoTxZ2tn3KiDl9Jku+eR4Vue28TzkJVDAumc3nj/uh0JpTc35\nhjImoslluYxJW1YMnR3DiM7DFtiaEV/xRl/n6WY40aIOJ4LrIhPnvfGqCVac2DBC\nxtCcI2PEqixD87dJd+StLldoZnmF81Cf/LLkrQO1AoGBAIw4Zj4Odo50/Zq0uZQP\nMpD9Dt7ePIS/snyaLy2UWlUnVpW65ElE8wUKif5rK16uEoHvUqsjHISCIUvyZWT8\nUkYLjxlWlMaR529dfnzuQ99G7MWQgwPeIO+qLYtCMroWcywSlscaaYctDNuRSeqA\nwCnWoBvAgABcglwLs1Eei4jH\n-----END PRIVATE KEY-----\n",
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
