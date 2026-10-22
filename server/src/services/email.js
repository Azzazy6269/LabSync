const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const getTemplate = (templateName) => {
    const filePath = path.join(__dirname, `../templates/emails/${templateName}.html`);
    return fs.readFileSync(filePath, 'utf8');
};


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

//await sendEmail(user.email,"Welcome to Our Blog!" , html);
const sendEmail =async (to, subject,templateName)=>{
    const html = getTemplate(templateName);
    const mailOptions = {
        from : process.env.EMAIL_FROM,
        to,
        subject,
        html
    }
    return await transporter.sendMail(mailOptions);
}


module.exports = { sendEmail }