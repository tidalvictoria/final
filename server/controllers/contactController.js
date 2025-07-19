const { sendEmail } = require('../utils/emailService'); // Import the email service

// @desc    Send a contact support email to developers
// @route   POST /api/contact
// @access  Public or Private (depending on route config)
const contactSupport = async (req, res) => {
    const { name, email, message } = req.body; // Assuming these fields from the frontend form

    // If user is authenticated, you can get their info from req.user
    const user = req.user; // Will be undefined if route is not protected

    const recipientEmail = process.env.DEVELOPER_EMAIL;
    if (!recipientEmail) {
        console.error('DEVELOPER_EMAIL not set in environment variables.');
        return res.status(500).json({ message: 'Contact support is not configured.' });
    }

    // Construct email content
    const emailSubject = `Home HealthHR Support: Message from ${name || (user ? user.username : 'Guest')}`;
    const emailText = `
        Sender Name: ${name || (user ? user.username : 'N/A')}
        Sender Email: ${email || (user ? user.email : 'N/A')}
        User Role: ${user ? user.role : 'Guest'}
        User ID: ${user ? user._id : 'N/A'}
        --------------------------------
        Message:
        ${message}
    `;
    const emailHtml = `
        <p><b>Sender Name:</b> ${name || (user ? user.username : 'N/A')}</p>
        <p><b>Sender Email:</b> ${email || (user ? user.email : 'N/A')}</p>
        <p><b>User Role:</b> ${user ? user.role : 'Guest'}</p>
        <p><b>User ID:</b> ${user ? user._id : 'N/A'}</p>
        <hr/>
        <p><b>Message:</b></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    try {
        await sendEmail({
        to: recipientEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        });
        res.status(200).json({ message: 'Support request sent successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send support request.' });
    }
};

module.exports = {
    contactSupport,
};