require('dotenv').config();
const express = require("express")
const app = express()
const conDB = require('./db/mongoose')
const cors = require('cors')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const userRouter = require('./routers/user')
const postRouter = require('./routers/post')
const likeRouter = require('./routers/like')
const commentRouter = require('./routers/comment')
const resetPasswordRoute = require('./routers/password')
const friendRoute = require('./routers/friend')
const deleteExpiredToken = require('./utils/expiredTokens')
const cron = require('node-cron')
const port = 8000

conDB()

app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(cors())
app.use(cookieParser())

app.use(userRouter)
app.use(postRouter)
app.use(likeRouter)
app.use(commentRouter)
app.use(resetPasswordRoute)
app.use(friendRoute)
cron.schedule('*/30 * * * *',deleteExpiredToken)   //run every 30 minutes

mongoose.connection.once('open', () => {
    console.log('Connected to DB');
    app.listen(port, () => {
        console.log('Server started on port ' + port);
    })
})