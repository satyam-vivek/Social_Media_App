const mongoose = require('mongoose')
const Comments = require('./comments')

const postSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    caption: {
        type: String
    },
    img: {
        type:Buffer
    },
    likes:{
        type: Map,
        of: Boolean,
        default: new Map()
    }
}, {
    timestamps: true
})

postSchema.virtual('comments', {
    ref:'Comments',
    localField:'_id',
    foreignField:'post_id'
})

postSchema.pre('deleteOne', {document: true}, async function(next) {
    const post = this
    try {
        console.log(post)
        await Comments.deleteMany({post_id:post._id})
        next()
    } catch (e) {
        res.status(500).send(e);
    }
})
const Posts = mongoose.model('Posts', postSchema)

module.exports = Posts