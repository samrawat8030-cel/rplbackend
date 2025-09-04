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
      const { name, email, phone, category, village, transactionId } = fields;

      if (!recipients || recipients.length === 0) {
        return res.status(400).json({ success: false, message: "Recipients are required." });
      }

      // 1️⃣ Google Sheets Auth
      const auth = new google.auth.GoogleAuth({
        credentials: {
          "type": "service_account",
          "project_id": process.env.GOOGLE_PROJECT_ID,
          "private_key_id": process.env.GOOGLE_PRIVATE_KEY_ID,
          "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDclGozezXnAHAz\n2HSJYeSnbiO4DLC+Ssijskl6G7+Q7edHhw3FjjTH7EkwQGdxDCTnW8CO3CCMt8G5\nzA1yD4Psgf0v4gwR8HkJAT6Kn3jZx/JntD+AbQCmmI+lgCCZuVUmGSjElLlAJxgU\nhAEAXUP9K0BnOdl5xig6A8cH5OMhYm6HtI+49py8juSfIjm7Ii1zdUNa2FXj4Ki6\nOEw80rPRyQdEfAQnhktzIIda+/L9y81fPE6XeW5A7DKxRU1eIhzdzmVgIozHVwo8\nVcyPFdIj/035aP+S9kIm3IDFm7JDLvN7qKisc3SpCdXny082TCTGTJrzqlYrtHot\nmBHlovY5AgMBAAECggEABinIHTUhne6SCVjQdMWSn9JWLCkqnRPg2aC8fdgdo6ff\nZk0R55sKwtVJfDrTHm0CRkv21ucJVR/jSVTiwUpJW4fhnP9kv/GR/Ybr35qyGT+w\nIxFTFDxiIBreKffTsV06JwIynz+FPOjQEEQEn8/QplfEM74sOJipUhRTRiyxOKMG\nqPBe8ytuD5sHq/ZN4Bi7h99QIwVTk9/B+XPVj/4UdHRvPWNokN0sFd7vus/pjXus\ngg0L2VJZbfiKA/fHNO2XwDEmgfZjUhEeZSY+P70R4yQEAAp5UAXw1Qp/Nv0D6L0n\ntr+FipFDgsrSDtbJqKDenCwQvEllPx61P6yCd8LVYwKBgQD0qXCHrxR5Cb+KYLAK\ncd8GrHgRR5Rq2AJJM71mtXoTVBo2vk+MXAfjdURt0qsZfThFlqJ4bzMcr7uxZ3Fv\nBA+EGFELWy4WUyBGYspGNnNDDCNrTl0yNdU+SYdRno6u8sMqX6Wf939AmwjN4Lru\n7wVx1nf1nAucvDcsT9ZWpql3uwKBgQDmzUaKQhO8nPcEdBYr3/oEdvOAXTPB3rxa\nRtPC/6Ybjt7hC6PjYXez69KCX0mZTSTs4BR61rgm4gXAPqYm/xz2s5ve0KkR8WQ0\ns7uPk2CCJ8ldhcTxescwgqwI/R/ydLDIxgA+fqUcfYT0gMJv4MY8DZV37WwihH1G\noukosjLomwKBgQDg0eqD5BBOAPUvdRWPI4Aro8RZLItnesLu/Upn3Q8mP7wu3cY/\nVjoxe4q72EA9leFloLv/Kz+udpVkuYd02ihf2/BtHQZGoXAg/Zqd1l8oFzlc24+s\nGeev6uUbzTWT8aQBhg6t5kHa3hvDA2UDNkSsjMWCvje1eQbCA0MUMOW9DQKBgBtH\nc+jvemm2m7OZDO3OoTxZ2tn3KiDl9Jku+eR4Vue28TzkJVDAumc3nj/uh0JpTc35\nhjImoslluYxJW1YMnR3DiM7DFtiaEV/xRl/n6WY40aIOJ4LrIhPnvfGqCVac2DBC\nxtCcI2PEqixD87dJd+StLldoZnmF81Cf/LLkrQO1AoGBAIw4Zj4Odo50/Zq0uZQP\nMpD9Dt7ePIS/snyaLy2UWlUnVpW65ElE8wUKif5rK16uEoHvUqsjHISCIUvyZWT8\nUkYLjxlWlMaR529dfnzuQ99G7MWQgwPeIO+qLYtCMroWcywSlscaaYctDNuRSeqA\nwCnWoBvAgABcglwLs1Eei4jH\n-----END PRIVATE KEY-----\n",
          "client_email": process.env.GOOGLE_CLIENT_EMAIL,
          "client_id": process.env.GOOGLE_CLIENT_ID,
          "auth_uri": process.env.GOOGLE_AUTH_URI,
          "token_uri": process.env.GOOGLE_TOKEN_URI,
          "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
          "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/rpl-league%40rpl-league.iam.gserviceaccount.com",
          "universe_domain": "googleapis.com"
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      const sheets = google.sheets({ version: "v4", auth });

      // 2️⃣ Append row to Google Sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A:F",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              String(name),
              String(email),
              String(phone),
              String(category),
              String(village),
              String(transactionId)
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
              <li><strong>Village:</strong> ${village}</li>
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
            <li><strong>Village:</strong> ${village}</li>
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
