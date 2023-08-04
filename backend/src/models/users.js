const mongoose = require('mongoose')
require('dotenv').config()
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const Posts = require('./posts')
const Comments = require('./comments')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        rquired: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid!')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim:true,
    },
    role: {
        type: String,
        default: 'user'
    },
    dob: {
        type: Date,
        required: true
    },
    profilePic: {
        type: Buffer
    },
    sentRequests: [{   // request sent to  following username
        username: {
            type: String,
            required: true
        }
    }],
    recievedRequests: [{  //request recieved from following username
        username: {
            type: String,
            required: true
        }
    }],
    friends: [{  
        username: {
            type: String,
            required: true
        }
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    resetPasswordToken: {
        type:String
    },
    resetPasswordExpire: {
        type:Date
    }
}, {
    timestamps: true
})

userSchema.virtual('posts', {
    ref: 'Posts',
    localField: 'username',
    foreignField: 'username'
})

// Remove cofidential data before sending back to client
userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.role
    delete userObject.sentRequests
    delete userObject.resetPasswordExpire
    delete userObject.resetPasswordToken
    return userObject
}

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.SECRET_KEY, { expiresIn: '1h'})
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

// Encrypting the password before saving to database
userSchema.pre('save', async function (next) { 
    const user = this 

    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next() 
})

userSchema.pre('deleteOne', {document: true}, async function(next) {
    const user = this
    try {
        await Posts.deleteMany({username: user.username})
        await Comments.deleteMany({username: user.username})
        user.sendRequests.forEach(async (username) => {
            const secondUser = await Users.findOne({username})
            secondUser.recievedRequests = secondUser.recievedRequests.filter((firstUser) => {
                return firstUser.username !== user.username
            })
        })
        user.recievedRequests.forEach(async (user) => {
            const secondUser = await Users.findOne({username})
            secondUser.sentRequests = secondUser.sentRequests.filter((firstUser) => {
                return firstUser.username !== user.username
            })
        })
        user.friends.forEach(async (user) => {
            const secondUser = await Users.findOne({username})
            secondUser.friends = secondUser.friends.filter((firstUser) => {
                return firstUser.username !== user.username
            })
        })
        next()
    } catch(e) {
        res.status(500).send()
    }
})

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await Users.findOne({email})

    if(!user) {
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)  
    if(!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

userSchema.methods.getResetPasswordToken = async function () {
    const user = this
    const resetToken = crypto.randomBytes(20).toString("hex")
    // Hash token (private key) and save to database
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    // Set token expire date
    user.resetPasswordExpire = Date.now() + 10 * (60 * 1000); // Ten Minutes
    await user.save()
    return resetToken;
}

const Users = mongoose.model('Users', userSchema)

module.exports = Users