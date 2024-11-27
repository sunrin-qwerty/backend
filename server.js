// src/server.js
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const { initializeDb } = require('./src/database')
const { authenticateToken } = require('./src/auth')
const { handleGoogleLogin } = require('./src/login')
require('dotenv').config()

let db
const app = express()
const PORT = 3000

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
}))
app.use(express.json())
app.use(cookieParser())
app.post('/login/google-login', (req, res) => handleGoogleLogin(req, res, db))

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
)

app.post('/login/google-login', async (req, res) => {
    try {
        const { token } = req.body
        const ticket = await oauth2Client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        
        const payload = ticket.getPayload()
        const email = payload['email']
        const emailParts = email.split('@')[0].match(/(\d{2})sunrin(\d{3})/)
        
        if (!emailParts || email.split('@')[1] !== 'sunrint.hs.kr') {
            return res.status(403).json({
                error: '잘못된 이메일 형식입니다.',
                message: '올바른 학교 이메일을 사용해주세요.'
            })
        }

        const [, admissionYear, studentNumber] = emailParts
        const nameMatch = payload['name'].match(/(\d)(\d{2})(\d{2})(.+)/)
        
        if (!nameMatch) {
            return res.status(403).json({
                error: '잘못된 이름 형식입니다.',
                message: '이름을 학번 형식에 맞게 설정해주세요.'
            })
        }

        const [, grade, classNum, number, realName] = nameMatch
        const userData = {
            googleId: payload['sub'],
            email,
            name: realName,
            admissionYear: parseInt(admissionYear),
            studentNumber: parseInt(studentNumber),
            grade: parseInt(grade),
            class: parseInt(classNum),
            number: parseInt(number)
        }

        await db.run(`
            INSERT INTO users (
                google_id, email, name,
                admission_year, student_number, 
                grade, class, number
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(google_id) DO UPDATE SET
                email=excluded.email,
                name=excluded.name,
                admission_year=excluded.admission_year,
                student_number=excluded.student_number,
                grade=excluded.grade,
                class=excluded.class,
                number=excluded.number
        `, [
            userData.googleId,
            userData.email,
            userData.name,
            userData.admissionYear,
            userData.studentNumber,
            userData.grade,
            userData.class,
            userData.number
        ])
        
        const userToken = jwt.sign(userData, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' })
        
        res.cookie('authToken', userToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax',
            maxAge: 3600000
        })
        
        res.status(200).json({
            message: '로그인에 성공했습니다.',
            user: {
                name: userData.name,
                email: userData.email,
                grade: userData.grade,
                class: userData.class,
                number: userData.number,
                picture: `https://plus.google.com/s2/photos/profile/${userData.googleId}`
            }
        })
    } catch (error) {
        console.error('[LOGIN ERROR]:', error)
        res.status(401).json({ 
            error: '로그인에 실패했습니다.',
            details: error.message 
        })
    }
})

app.get('/check-auth', authenticateToken, async (req, res) => {
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

app.post('/logout', (req, res) => {
    res.clearCookie('authToken')
    res.status(200).json({ message: '로그아웃되었습니다.' })
})

const startServer = async () => {
    db = await initializeDb()
    app.listen(PORT, () => {
        console.log(`[SERVER] Running on port ${PORT}`)
    })
}

startServer()

module.exports = app