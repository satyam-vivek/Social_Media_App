require('dotenv').config({path:'./env'})
const mongoose = require('mongoose')


const dbconnection = async () => {
    try {
        mongoose.connect(process.env.DATABASE_URI,{
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
    }catch (err) {
        console.log(err);
    }
}

module.exports = dbconnection