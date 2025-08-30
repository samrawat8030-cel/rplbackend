const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { recipients, name, phone, category, village, transactionId, senderName, contactInfo, website } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, message: "Recipients are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // Google App Password
      },
    });

    for (let recipient of recipients) {
      const mailOptions = {
        from: `"SMVDK Sports World Pvt Limited" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `Congratulations ${name}! Registration Completed`,
        html: `
          <p>Dear <strong>${name}</strong>,</p>
          <p>🎉 Congratulations! Your registration for <strong>RPL NCR Gramin League</strong> is now complete.</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Village:</strong> ${village}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <br>
          <p>We look forward to seeing your performance on the field!</p>
          <br>
          <p>Best Regards,<br>${senderName}<br>${contactInfo}<br>
          <a href="${website}">${website}</a></p>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return res.status(200).json({ success: true, message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ success: false, message: "Failed to send emails", error: error.message });
  }
};
