const isAdmin = async (req, res, next) => {
    try {
        if(req.user.role !== 'admin') {
            return res.status(403).send('Unauthorized Access')
        }
        next()
    } catch(e) {
        res.status(500).send()
    }
}

module.exports = isAdmin