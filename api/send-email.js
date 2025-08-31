const nodemailer = require("nodemailer");
require("dotenv").config();
const path = require("path");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { recipients, name, email, phone, category, village, transactionId } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, message: "Recipients are required." });
  }

  if (!name || !email || !phone || !category || !village || !transactionId) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // Google App Password
      },
    });

    // 1️⃣ Email to Organizers
    for (let recipient of recipients) {
      const mailOptions = {
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
            cid: "logo",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
    }

    // 2️⃣ Confirmation email to Player
    const playerMailOptions = {
      from: `"SMVDK Sports World Pvt Limited" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Congratulations ${name}! Your Registration is Confirmed - RPL NCR GRAMIN LEAGUE`,
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
          cid: "logo",
        },
      ],
    };

    await transporter.sendMail(playerMailOptions);

    return res.status(200).json({
      success: true,
      message: "Emails sent successfully to organizers & player!",
    });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send registration email",
      error: error.message,
    });
  }
};
