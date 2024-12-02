const express = require('express')
const { authenticateToken } = require('./auth')

const router = express.Router()

router.get('/', async (req, res) => {
    const db = req.app.locals.db
    try {
        const assignments = await db.all('SELECT * FROM assignment')
        res.json(assignments)
    } catch (error) {
        res.status(500).json({ error: 'Database error' })
    }
})

router.post('/', authenticateToken, async (req, res) => {
    const db = req.app.locals.db
    const { title, content, deadline } = req.body
    try {
        await db.run(`
            INSERT INTO assignment (title, content, deadline)
            VALUES (?, ?, ?)
        `, [title, content, deadline])
        res.status(201).json({ message: '과제가 성공적으로 생성되었습니다.' })
    } catch (error) {
        res.status(500).json({ error: 'Database error' })
    }
})

module.exports = router