const express = require('express')
const router = new express.Router()
const Users = require('../models/users')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')

router.post('/resetPassword', async (req, res) => {
    try {
        const user = await Users.findOne({email: req.body.email})
        if(!user) {
            return res.status(400).send('User not found')
        }
        const subject = 'Password reset Link'
        const token = await user.getResetPasswordToken()  // Get new token for verification
        const link = `${process.env.URL}/resetPassword/${token}`  //Create link using token
        const text = `This is your password reset link ${link}`
        const sent = await sendEmail(user.email, subject, text)  // Send email, subject and password reset link to sendEmail()
        if (!sent) {
            throw new Error('Unable to send email')
        }
        res.send(token)
    } catch (e) {
        res.status(500).send(e)
    }   
})

router.post('/resetPassword/:token', async (req, res) => {
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex")
    try {
          const user = await Users.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now()}
          })
      
          if (!user) {
            return res.status(400).send('Invalid token or session timed out')
          }
      
          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpire = undefined;
          user.tokens = []
          await user.save()
          res.send('Password Reset Successfully')
    } catch(e) {
        res.status(400).send(e)
    }
})

module.exports = router