const nodemailer = require("nodemailer");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

module.exports = async (req, res) => {
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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // 📸 Screenshot handling (attachment only, no inline)
      let screenshotAttachment = [];
      console.log(files?.screenshot, 'files screenshot');
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

      // 1️⃣ Organizer Email
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

      // 2️⃣ Confirmation Email to Player
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

      return res.status(200).json({ success: true, message: "Emails sent successfully!" });
    } catch (error) {
      console.error("Email error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send registration email",
        error: error.message,
      });
    }
  });
};
