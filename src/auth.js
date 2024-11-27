const jwt = require('jsonwebtoken')

function authenticateToken(req, res, next) {
    const token = req.cookies.authToken
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret')
        req.user = user
        next()
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' })
    }
}

module.exports = { authenticateToken }