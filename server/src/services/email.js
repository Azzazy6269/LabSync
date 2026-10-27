const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const getTemplate = (templateName, replacements = {}) => {
    const filePath = path.join(__dirname, `../templates/emails/${templateName}.html`);
    let html = fs.readFileSync(filePath, 'utf8');

    Object.keys(replacements).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, replacements[key]);
    });

    return html;
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async (to, subject, templateName, replacements = {}) => {
    const html = getTemplate(templateName, replacements);
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
    };
    return await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };