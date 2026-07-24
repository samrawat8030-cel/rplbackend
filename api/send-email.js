const nodemailer = require("nodemailer");
const formidable = require("formidable");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

module.exports = async (req, res) => {
  // ✅ Allow CORS
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

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(400).json({ success: false, message: "Invalid form data" });
    }

    try {
      const recipients = JSON.parse(fields.recipients || "[]");
      const { name, email, phone, category, address, adhaar, transactionId } = fields;

      if (!recipients || recipients.length === 0) {
        return res.status(400).json({ success: false, message: "Recipients are required." });
      }

      // 1️⃣ Google Sheets Auth
      const auth = new google.auth.GoogleAuth({
        credentials: {
          "type": "service_account",
          "project_id": process.env.GOOGLE_PROJECT_ID,
          "private_key_id": process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
          "client_email": process.env.GOOGLE_CLIENT_EMAIL,
          "client_id": process.env.GOOGLE_CLIENT_ID,
          "auth_uri": process.env.GOOGLE_AUTH_URI,
          "token_uri": process.env.GOOGLE_TOKEN_URI,
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/rpl-league%40rpl-league.iam.gserviceaccount.com",
          "universe_domain": "googleapis.com"
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      const sheets = google.sheets({ version: "v4", auth });

      // 2️⃣ Check Aadhaar duplication in Google Sheet
      const normalizedAdhaar = String(adhaar || "").trim();
      if (!normalizedAdhaar) {
        return res.status(400).json({
          success: false,
          errorCode: "AADHAAR_REQUIRED",
          message: "Aadhaar number is required for registration.",
          userMessage: "Please provide a valid Aadhaar number before submitting the registration.",
        });
      }

      const existingAdhaarResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!G:G",
      });
      const existingAdhaars = (existingAdhaarResponse.data.values || []).flat().map((value) => String(value).trim());

      if (existingAdhaars.includes(normalizedAdhaar)) {
        return res.status(409).json({
          success: false,
          errorCode: "AADHAAR_DUPLICATE",
          message: "This Aadhaar number is already registered. Please use a different Aadhaar number to submit a new registration.",
          userMessage: "Aadhaar number already exists in our records. Please resubmit using a different Aadhaar number.",
        });
      }

      // 3️⃣ Append row to Google Sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A:G",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              String(name),
              String(email),
              String(phone),
              String(category),
              String(address),
              String(transactionId),
              normalizedAdhaar,
            ]
          ]
        },
      });

      // 3️⃣ Setup Nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // 4️⃣ Handle optional screenshot attachment
      let screenshotAttachment = [];
      if (files.screenshot) {
        const screenshotFile = Array.isArray(files.screenshot)
          ? files.screenshot[0]
          : files.screenshot;
        if (screenshotFile && screenshotFile.filepath) {
          const fileBuffer = fs.readFileSync(screenshotFile.filepath);
          screenshotAttachment.push({
            filename: screenshotFile.originalFilename,
            content: fileBuffer,
          });
        }
      }

      // 5️⃣ Send emails to organizers
      for (let recipient of recipients) {
        await transporter.sendMail({
          from: `"SMVDK Sports World Pvt Limited" <${process.env.EMAIL_USER}>`,
          to: recipient,
          subject: "📩 New Player Registration - RPL NCR GRAMIN LEAGUE",
          html: `
            <h2>New Player Registration</h2>
            <p>A new player has registered for <strong>RPL NCR Gramin League</strong>.</p>
            <h3>🔹 Player Details:</h3>
            <ul>
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Phone:</strong> ${phone}</li>
              <li><strong>Category:</strong> ${category}</li>
              <li><strong>Address:</strong> ${address}</li>
              <li><strong>Adhaar:</strong> ${normalizedAdhaar}</li>
            </ul>
            <h3>💳 Payment Info:</h3>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <br>
            <p>✅ Please verify the details and confirm the registration.</p>
          `,
          attachments: [
            {
              filename: "logo.jpeg",
              path: path.join(process.cwd(), "assets/images/logo.jpeg"),
            },
            ...screenshotAttachment,
          ],
        });
      }

      // 6️⃣ Send confirmation email to player
      await transporter.sendMail({
        from: `"SMVDK Sports World Pvt Limited" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🎉 Congratulations ${name}! Registration Confirmed - RPL NCR GRAMIN LEAGUE`,
        html: `
          <h2 style="color: #4caf50;">Congratulations, ${name}! 🎉</h2>
          <p>Your registration for <strong>RPL NCR Gramin League</strong> is successfully completed.</p>
          <h3>📋 Your Registration Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            <li><strong>Category:</strong> ${category}</li>
            <li><strong>Address:</strong> ${address}</li>
            <li><strong>Adhaar:</strong> ${normalizedAdhaar}</li>
          </ul>
          <h3>💳 Payment Info:</h3>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <br>
          <p>✅ Get ready to showcase your talent on the field!</p>
        `,
        attachments: [
          {
            filename: "logo.jpeg",
            path: path.join(process.cwd(), "assets/images/logo.jpeg"),
          },
          ...screenshotAttachment,
        ],
      });

      return res.status(200).json({ success: true, message: "Sheet updated & emails sent successfully!" });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });
};
