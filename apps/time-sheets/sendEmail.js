const { getRecipients } = require('./store');
var nodemailer = require('nodemailer');

const sendPDF = async (subject, recipientsOverride = []) => {
    console.log('subject', subject)
    let dbRecipients = [];
    try {
      dbRecipients = await getRecipients(true);
    } catch (error) {
      console.log('Error loading recipients from store', error);
    }

    const activeRecipients = Array.isArray(recipientsOverride) && recipientsOverride.length > 0
      ? recipientsOverride
      : dbRecipients.map((recipient) => recipient.email);

    const toList = activeRecipients.length > 0 ? activeRecipients : ['bicknoston@gmail.com'];

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'northcarolinaroadbusiness',
        pass: 'gfyb wfor ymzk jbhb',
      }
    });

    const mailOptions = {
      from: 'northcarolinaroadbusiness@gmail.com',
      to: toList,
      subject: subject,
      text: 'Please find attached the time sheet for the day.',
      attachments: [
        {
          filename: 'generatedReceipt.pdf',
          path: '/tmp/generatedReceipt.pdf',
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false };
    }
}

module.exports = { sendPDF };
