const express = require('express')
const router = new express.Router()
const Users = require('../models/users')
const auth= require('../middleware/authenticate')
const isAdmin = require('../middleware/isAdmin')
const multer = require('multer')
const sharp = require('sharp')


router.post('/login', async (req,res) => {
    try {
        const user = await Users.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.cookie('authcookie', token, {httpOnly:true, maxAge: 60*60*1000}).send({user})  // 1 hour
    } catch (e) {
        res.status(400).send(e)
    } 
})

router.post('/register', async (req, res) => {
    const user = new Users(req.body)
    try {
        await user.save()
        res.status(201).send('Registered Successfully')
    } catch(e) {
        res.status(400).send(e)
    }  
})

router.post('/user/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send('Logged out Succesfully')
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/user/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send('Logged out of all devices') 
    } catch (e) {
        res.status(500).send()
    }
})
router.get('/user/me', auth, async (req, res) => {
    res.send(req.user)
})

router.get('/user/:username', auth, async (req, res) => {
    try {
        if(req.user.username === req.params.username) {
            return res.send(req.user)
        } else {
            const user = await Users.findOne({username:req.params.username})
            if(!user) {
                return res.send('User not found')
            }
            res.send({
                username: user.username,
                email: user.email,
                profilePic: user.profilePic
            })
        }
        
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/user/admin/:username', auth, isAdmin, async(req, res) => {
    try {
        const user = await Users.findOne({username:req.params.username})
        if(!user) {
            return res.send('User not found')
        }
        res.send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.patch('/user/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['username', 'dob']
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation) {
        return res.status(400).send('Invalid Request')
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.status(205).send(req.user)
    } catch(e) {
        res.status(500).send()
    }
})

router.delete('/user/me', auth, async (req, res) => {
    try {
        await req.user.deleteOne()
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

const upload = multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {  //match takes regex .jpg || .jpeg//$-> means at end
            return cb(new Error('Please povide image')) 
        }
        cb(undefined, true) 
    }
})

router.post('/user/me/profilePic', auth, upload.single('profilePic'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).jpeg().toBuffer() 
    req.user.profilePic = buffer
    await req.user.save()
    res.send('Image uploaded successfully')
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.get('/user/:username/profilePic', async (req, res) => {
    try {
        const user = await User.findOne({username:req.params.username})
        if(!user || !user.avatar) {
            throw new Error('Image not found!')
        }

        res.set('Content-Type', 'image/jpeg') 
        res.send(user.avatar)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/user/me/profilePic', auth, async (req, res) => {
    req.user.profilePic = undefined
    await req.user.save()
    res.send('Image deleted successfully')
})

module.exports = router