import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

// Needed for __dirname in ES modules (Vercel uses ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract name from email
const extractNameFromEmail = (email) => {
  if (!email) return "Valued Player";
  const namePart = email.split("@")[0];
  return namePart
    .replace(/[\.\_\-]/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { recipients, name, phone, category, village, email, transactionId } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, message: "Recipients are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (let recipient of recipients) {
      const clientName = extractNameFromEmail(recipient);

      const mailOptions = {
        from: `"SMVDK Sports World Pvt Ltd" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        bcc: recipient,
        subject: "🎉 RPL NCR Gramin League Registration Successful",
        html: `
          <h2>Congratulations ${name} 🎉</h2>
          <p>Your registration for <strong>RPL NCR Gramin League</strong> is completed successfully!</p>
          <p><b>Player Details:</b></p>
          <ul>
            <li><b>Name:</b> ${name}</li>
            <li><b>Email:</b> ${email}</li>
            <li><b>Phone:</b> ${phone}</li>
            <li><b>Village:</b> ${village}</li>
            <li><b>Category:</b> ${category}</li>
            <li><b>Transaction ID:</b> ${transactionId}</li>
          </ul>
          <p>We are excited to see you on the ground 🏏</p>
          <br>
          <strong>SMVDK Sportsworld Pvt Ltd</strong>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${recipient}`);
    }

    return res.status(200).json({ success: true, message: "Emails sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
