const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //* CREATE A TRANSPORTER
  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USERNAME, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });
  //* DEFINE THE EMAIL OPTIONS
  const mailOption = {
    from: "Sanjay <hello@sanjay.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.message,
  };
  //* SEND THE EMAILS
  await transporter.sendMail(mailOption);
};

module.exports = sendEmail;
