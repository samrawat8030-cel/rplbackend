require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Email sender function
const sendEmail = async (recipients, { name, email, phone, category, village, transactionId }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password from Gmail
    },
  });

  // 1️⃣ Email to Organizers
  for (let recipient of recipients) {
    const mailOptions = {
      from: `"SMVDK Sports World Pvt Limited" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: "📩 New Player Registration - RPL NCR GRAMIN LEAGUE",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ff9800;">New Player Registration</h2>
          <p>A new player has registered for <strong>RPL NCR Gramin League</strong>.</p>

          <h3>🔹 Player Details:</h3>
          <ul style="line-height: 1.6;">
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            <li><strong>Category:</strong> ${category}</li>
            <li><strong>Village:</strong> ${village}</li>
          </ul>

          <h3>💳 Payment Info:</h3>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>

          <br/>
          <p>✅ Please verify the details and confirm the registration.</p>

          <br/>
          <p style="font-size: 12px; color: #777;">SMVDK Sports World Pvt Ltd</p>
          <img src="cid:logo" alt="RPL Logo" width="200" />
        </div>
      `,
      attachments: [
        {
          filename: "logo.jpeg",
          path: path.join(__dirname, "assets/images/logo.jpeg"),
          cid: "logo",
        },
      ],
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Organizer Email sent to ${recipient}: ` + info.response);
    } catch (error) {
      console.error(`Error sending email to ${recipient}:`, error);
    }
  }

  // 2️⃣ Email to Player (confirmation)
  const playerMailOptions = {
    from: `"SMVDK Sports World Pvt Limited" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🎉 Congratulations ${name}! Your Registration is Confirmed - RPL NCR GRAMIN LEAGUE`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4caf50;">Congratulations, ${name}! 🎉</h2>
        <p>We are excited to inform you that your registration for <strong>RPL NCR Gramin League</strong> has been successfully completed.</p>

        <h3>📋 Your Registration Details:</h3>
        <ul style="line-height: 1.6;">
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Category:</strong> ${category}</li>
          <li><strong>Village:</strong> ${village}</li>
        </ul>

        <h3>💳 Payment Info:</h3>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>

        <br/>
        <p>✅ Our team will reach out to you soon with further updates. Get ready to showcase your talent on the field!</p>

        <br/>
        <p style="font-size: 12px; color: #777;">Best Regards,<br/>SMVDK Sports World Pvt Ltd</p>
        <img src="cid:logo" alt="RPL Logo" width="200" />
      </div>
    `,
    attachments: [
      {
        filename: "logo.jpeg",
        path: path.join(__dirname, "assets/images/logo.jpeg"),
        cid: "logo",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(playerMailOptions);
    console.log(`Confirmation Email sent to Player ${email}: ` + info.response);
  } catch (error) {
    console.error(`Error sending confirmation email to Player:`, error);
  }

  return { success: true, message: "Emails sent successfully to organizers & player!" };
};

// API Route to send emails
app.post("/send-email", async (req, res) => {
  const { recipients, name, email, phone, category, village, transactionId } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, message: "Recipients are required." });
  }

  if (!name || !email || !phone || !category || !village || !transactionId) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const response = await sendEmail(recipients, { name, email, phone, category, village, transactionId });
  res.json(response);
});

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
