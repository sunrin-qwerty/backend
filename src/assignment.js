const express = require('express')
const { authenticateToken } = require('./auth')

const router = express.Router()

router.get('/', async (req, res) => {
    const db = req.app.locals.db
    try {
        const assignments = await db.all('SELECT * FROM assignment')
        const assignmentsWithStatus = await Promise.all(assignments.map(async (assignment) => {
            const submissions = await db.all('SELECT * FROM submission WHERE assignment_id = ?', [assignment.id])
            assignment.status = submissions.length > 0 ? '제출됨' : '과제 미제출'
            return assignment
        }))
        res.json(assignmentsWithStatus)
    } catch (error) {
        console.error("Error fetching assignments:", error.message)
        res.status(500).json({ error: "Database error" })
    }
})

router.get('/:id/submissions', authenticateToken, async (req, res) => {
    const db = req.app.locals.db
    const assignmentId = req.params.id
    try {
        const submissions = await db.all('SELECT * FROM submission WHERE assignment_id = ?', [assignmentId])
        res.json(submissions)
    } catch (error) {
        console.error("Error fetching submissions:", error.message)
        res.status(500).json({ error: "Database error" })
    }
})

module.exports = router