const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const sendEmail = async ({
  to,
  subject,
  templatePath,
  replacements = {},
  html,
}) => {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: "true",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 60000,
  });

  let htmlContent = html;
  if (!htmlContent && templatePath) {
    const filePath = path.join(__dirname, templatePath);
    htmlContent = fs.readFileSync(filePath, "utf-8");
  }

  for (const key in replacements) {
    htmlContent = htmlContent.replace(
      new RegExp(`{{${key}}}`, "g"),
      replacements[key]
    );
  }
  await transport.sendMail({
    from: "Auth registration <no-reply@AuthTesting.com>",
    to,
    subject,
    html: htmlContent,
  });
};

module.exports = sendEmail;
