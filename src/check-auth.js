const express = require('express')
const { authenticateToken } = require('./auth')

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
    const db = req.app.locals.db 
    try {
        const user = await db.get('SELECT * FROM users WHERE google_id = ?', [req.user.googleId])
        if (user) {
            res.json({
                name: user.name,
                email: user.email,
                grade: user.grade,
                class: user.class,
                number: user.number,
                picture: `https://plus.google.com/s2/photos/profile/${user.google_id}`
            })
        } else {
            res.status(404).json({ error: 'User not found' })
        }
    } catch (error) {
        res.status(500).json({ error: 'Database error' })
    }
})

module.exports = router