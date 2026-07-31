require("dotenv").config();

const SibApiV3Sdk = require("sib-api-v3-sdk");
const fs = require("fs");
const path = require("path");

// Configure Brevo API Key
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Create Transactional Email API instance
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async ({
  to,
  subject,
  templatePath,
  replacements = {},
  html,
}) => {
  let htmlContent = html;

  // Load HTML template if no HTML content was provided
  if (!htmlContent && templatePath) {
    const filePath = path.join(__dirname, templatePath);
    htmlContent = fs.readFileSync(filePath, "utf-8");
  }

  // Replace template placeholders
  for (const key in replacements) {
    htmlContent = htmlContent.replace(
      new RegExp(`{{${key}}}`, "g"),
      replacements[key],
    );
  }

  // Create email object
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: "Auth Registration",
    email: process.env.BREVO_SENDER_EMAIL,
  };

  sendSmtpEmail.to = [
    {
      email: to,
    },
  ];

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("✅ Email sent successfully");
    return response;
  } catch (error) {
    console.error(
      "❌ Brevo send error:",
      error.response?.body || error.message,
    );
    throw error;
  }
};

module.exports = sendEmail;
