const nodemailer = require('nodemailer')
require('dotenv').config()

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = new nodemailer.createTransport({
            service: process.env.SERVICE,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS
            }
        })

        await transporter.sendMail({
            from: process.env.USER,
            to: email,
            subject: subject,
            text: text,
        });

        console.log('Email sent successfuly')
        return true
    } catch(e) {
        console.log(e, "Email not sent")
        return false
    }
}

module.exports = sendEmail
