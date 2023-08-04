const express = require('express')
const router = new express.Router()
const Posts = require('../models/posts')
const auth = require('../middleware/authenticate')
const multer = require('multer')
const sharp = require('sharp')

const upload = multer({
    limits:{
        fileSize:10000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {  //match takes regex .jpg || .jpeg//$-> means at end
            return cb(new Error('Please povide image')) 
        }
        cb(undefined, true) 
    }
})

router.post('/post', auth, upload.single('img'), async (req, res) => { 
    if(!req.body.caption && !req.file) {
        return res.status(400).send('Please provide some content')
    }
    var post = undefined
    if(req.body.caption && req.file) {
        const buffer = await sharp(req.file.buffer).jpeg().toBuffer()
            post = new Posts({
            username: req.user.username,
            img: buffer,
            owner: req.user._id,
            caption: req.body.caption
        })
    } else if(req.body.caption) {
            post = new Posts({
            username: req.user.username,
            owner: req.user._id,
            caption: req.body.caption
        })
    } else {
        const buffer = await sharp(req.file.buffer).jpeg().toBuffer()
            post = new Posts({
            username: req.user.username,
            img: buffer,
            owner: req.user._id
        })
    }
    try {
        await post.save()
        res.status(201).send(post)
    } catch (e) {
        res.status(500).send(e)
    }
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

//GET /task?limit=10&skip=0 
//GET /task?sortBy=createdAt_desc ->any delimiter 
router.get('/posts', auth, async (req, res) => {
    try {
        await req.user.populate({
            path: 'posts',
            options: {   //used for pagination and sorting 
                limit:parseInt(req.query.limit),  //works only if we get an integer
                skip: parseInt(req.query.skip),
                sort:{
                    createdAt: -1
                }
            }
        }) 
        res.status(200).send(req.user.posts)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/feed', auth, async (req, res) => {
    let skip = 0
    if(req.query.skip) {
        skip = req.query.skip
    }
    try {
        const allPosts = await Posts.find().sort({
            createdAt: -1
        }).skip(skip).limit(10)
        res.send(allPosts)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/post/:id', async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id)
        if(!post) {
            throw new Error('Post not found!')
        }
        res.send(post)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/post/:id', auth, async(req, res) => {
    try {
        const post = await Posts.findById(req.params.id)
        if(!post) {
            res.status(404).send()
        }
        await post.deleteOne()
        res.send(post)
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router