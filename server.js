const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { initializeDb } = require('./src/database')
const { handleGoogleLogin } = require('./src/login')
const checkAuthRouter = require('./src/check-auth')
const assignmentRouter = require('./src/assignment')
const applyRouter = require('./src/apply')
require('dotenv').config()

const app = express()
const PORT = 3000

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
}))

app.use(express.json())
app.use(cookieParser())

const startServer = async () => {
    const db = await initializeDb()
    app.locals.db = db

    app.use('/check-auth', checkAuthRouter)
    app.use('/assignments', assignmentRouter)
    app.use('/apply', applyRouter)

    app.post('/login/google-login', (req, res) => handleGoogleLogin(req, res, db))

    app.post('/logout', (req, res) => {
        res.clearCookie('authToken')
        res.status(200).json({ message: '로그아웃되었습니다.' })
    })
    
    app.listen(PORT, () => {
        console.log(`[SERVER] Running on port ${PORT}`)
    })
}

startServer()

module.exports = app