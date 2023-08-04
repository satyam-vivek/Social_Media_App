const jwt = require('jsonwebtoken')
const User = require('../models/users')
require('dotenv').config()

//method for authentication of the user
const auth = async (req, res, next)=> {
    try {
        const token = req.cookies.authcookie
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})                                                                    
        if(!user) {
            throw new Error()
        }
        req.user = user
        req.token = token
        next()
    } catch (e) {
        res.status(401).send({error: "Please Login or Sign up"})
    }
}

module.exports = auth