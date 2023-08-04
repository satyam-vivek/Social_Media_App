const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectID,
        required: true,
        ref: 'Posts'
    },
    username: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

const Comments = mongoose.model('Comments', commentSchema)

module.exports = Comments