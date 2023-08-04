const express = require('express')
const router = new express.Router()
const Users = require('../models/users')
const auth = require('../middleware/authenticate')

const getFriendStat = (user1, user2) => {
    try {
        const sent = user1.sentRequests.find((user) => {
            return user.username === user2.username
        })
        if(sent !== undefined) {
            return 1   // request sent by user1 to user2
        }
        console.log(sent)
        const recieved = user2.sentRequests.find((user) => {
            return user.username === user1.username
        })
        if(recieved !== undefined) {
            return -1   //request sent by user2 to user1
        }
        console.log(recieved)
        const friend = user1.friends.find((user) => {
            return user.username === user2.username
        })
        if(friend !== undefined) {
            return 2   //friends
        }
        console.log(friend)
        return 0   //no connection
    } catch (e) {
        console.log(e)
    }
}
router.post('/addFriend', auth, async (req, res) => {  // send or unsend friend request  
    try{
        const sendTo = await Users.findOne({username:req.body.username})
        console.log('run')
        const stat = getFriendStat(req.user, sendTo)
        if(stat === 2) {
            res.send('Already friends')
        } else if(stat === -1) {
            res.send('Can not perform the operation')
        } else if(stat === 0) {
            req.user.sentRequests = req.user.sentRequests.concat({username: req.body.username})
            await req.user.save()
            sendTo.recievedRequests = sendTo.recievedRequests.concat({username: req.user.username})
            await sendTo.save()

            res.send('Request sent successfully')
        } else if(stat === 1) {
            req.user.sentRequests = req.user.sentRequests.filter((user) => {
                return user.username !== req.body.username
            })
            await req.user.save()
            sendTo.recievedRequests = sendTo.recievedRequests.filter((user) => {
                return user.username !== req.user.username
            })
            await sendTo.save()
            res.send('Request removed successfully')
        }
    } catch(e) {
        res.status(400).send(e)
    }
})

router.post('/requests', auth, async(req, res) => {  // accept or remove request 
    try {
        const sentBy = await Users.findOne({username: req.body.username})
        req.user.recievedRequests = req.user.recievedRequests.filter((user) => {
            return user.username !== req.body.username
        })
        sentBy.sentRequests = sentBy.sentRequests.filter((user) => {
            return user.username !== req.user.username
        })
        if(req.body.accept) {  //request accepted
            req.user.friends = req.user.friends.concat({username: sentBy.username})
            sentBy.friends = sentBy.friends.concat({username: req.user.username})
            await req.user.save()
            await sentBy.save()
            res.send('Friend added successully')
        } else {
            await req.user.save()
            await sentBy.save()
            res.send('Request removed')
        }
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/removeFriend', auth, async(req, res) => {  // remove friend
    try {
        const removeUser = await Users.findOne({username: req.body.username})
        req.user.friends = req.user.friends.filter((user) => {
            return user.username !== req.body.username
        })
        removeUser.friends = removeUser.friends.filter((user) => {
            return user.username !== req.user.username
        })
        await req.user.save()
        await removeUser.save()
        res.send('User removed')
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/friendStat', auth, async (req,res) => {
    try{
        const anotherUser = await Users.findOne({username: req.body.username})
        res.send({stat:getFriendStat(req.user, anotherUser)}) 
    } catch(e) {
        res.status(500).send(e)
    }
})
router.get('/requests', auth, async(req, res) => {  // all requests
    try {
        res.send(req.user.recievedRequests)
    } catch(e) {
        res.status(500).send('Unable to fetch')
    }
})

router.get('/friends', auth, async (req, res) => {  // get all friends of user
    try {
        res.send(req.user.friends)
    } catch(e) {
        res.status(500).send('Unable to fetch')
    }
})

// If deleting a user then its username should be deleted from all other user's friend database

module.exports = router