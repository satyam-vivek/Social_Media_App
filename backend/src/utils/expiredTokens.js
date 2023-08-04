const Users = require('../models/users')

const deleteExpiredToken = async () => {
    try {
        const allUsers = await Users.find({})
        const time = Date.now()
        for (const user of allUsers) {
            // Filter and remove expired tokens for each user
            user.tokens = user.tokens.filter((token) => {
                return token.expiresAt >= time
            })
            await user.save() // Save the updated user document
        }
    } catch(e) {
        console.log('Background process error ' + e)
    }
}

module.exports = deleteExpiredToken