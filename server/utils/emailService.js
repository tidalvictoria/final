const sgMail = require('@sendgrid/mail');

// Ensure dotenv is loaded in your main server.js file
// so process.env.SENDGRID_API_KEY is available here.
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text, html) => {
    const msg = {
        to, // Recipient email address
        from: process.env.SENDGRID_SENDER_EMAIL, // Your verified sender email
        subject, // Email subject
        text, // Plain text body
        html, // HTML body (optional, but good for rich content)
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent successfully to ${to}`);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email via SendGrid:', error);
        // Log detailed error from SendGrid if available
        if (error.response) {
        console.error(error.response.body);
        }
        throw new Error('Failed to send email'); // Re-throw for calling function to handle
    }
    };

    module.exports = {
    sendEmail,
};




// // This will use Nodemailer to send emails. 
// // You'll need to configure an email service (e.g., Gmail with an App Password, SendGrid, Mailgun)
// const nodemailer = require('nodemailer');
// const dotenv = require('dotenv');

// dotenv.config({ path: '../.env' }); // Ensure .env is loaded

// // Create a transporter object using the default SMTP transport
// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST || 'smtp.gmail.com', // e.g., 'smtp.gmail.com' for Gmail
//     port: process.env.EMAIL_PORT || 587, // 587 for TLS, 465 for SSL
//     secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
//     auth: {
//         user: process.env.EMAIL_USER, // Your email address
//         pass: process.env.EMAIL_PASS, // Your email password or app password
//     },
//     tls: {
//         // Do not fail on invalid certs (for development, remove in production)
//         rejectUnauthorized: false
//     }
// });

// const sendEmail = async ({ to, subject, text, html }) => {
//     try {
//         const info = await transporter.sendMail({
//         from: process.env.EMAIL_USER, // sender address
//         to: to, // list of receivers
//         subject: subject, // Subject line
//         text: text, // plain text body
//         html: html, // html body
//         });

//         console.log('Message sent: %s', info.messageId);
//         return true; // Email sent successfully
//     } catch (error) {
//         console.error('Error sending email:', error);
//         throw new Error('Failed to send email');
//     }
// };

// module.exports = {
//     sendEmail,
// };