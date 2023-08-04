const express = require('express')
const router = new express.Router()
const Comments = require('../models/comments')
const Posts = require('../models/posts')
const auth = require('../middleware/authenticate')

router.post('/:id/comment', auth, async (req, res) => {  //id is post id
    const comment = new Comments({
        text: req.body.text,
        username: req.user.username,
        post_id: req.params.id
    })
    try {
        await comment.save()
        res.status(201).send(comment)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/:id/comment', async (req, res) => {   //id is post id
    try {
        const post = await Posts.findOne({_id: req.params.id})
        await post.populate({
            path: 'comments',
            options: {   //used for pagination and sorting 
                limit:parseInt(req.query.limit),  //works only if we get an integer
                skip: parseInt(req.query.skip),
                sort:{
                    createdAt: -1
                }
            }
        }) 
        res.status(200).send(post.comments)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.patch('/comment/:id', auth, async(req, res) => {   // id is comment id
    try {
        if(!req.body.text) {
            res.status(401).send('Invalid Request')
        }
        const comment = await Comments.findOne({_id:req.params.id})
        comment.text = req.body.text
        await comment.save()
        res.status(201).send('Comment updated Successfully')
    } catch(e) {
        res.status(500).send(e)
    }
})

router.delete('/comment/:id', auth, async(req, res) => {  //id is comment id
    try {
        const comment = await Comments.findOneAndDelete({_id:req.params.id})
        if(!comment) {
            res.status(400).send('Comment not found')
        }
        res.send(comment)
    } catch(e) {
        res.status(500).send(e)
    }
})         

module.exports = router
