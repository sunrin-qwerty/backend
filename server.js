const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const punycode = require('punycode')
global.Punycode = punycode

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
}))
app.use(express.json())
app.use(cookieParser())

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
)

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'

app.post('/login/google-login', async (req, res) => {
    try {
        const { token } = req.body
        
        const ticket = await oauth2Client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        
        const payload = ticket.getPayload()
        
        const userData = {
            googleId: payload['sub'],
            email: payload['email'],
            name: payload['name'],
            picture: payload['picture']
        }
        
        const emailDomain = userData.email.split('@')[1]
        if (emailDomain !== 'sunrint.hs.kr') {
            console.log(`[LOGIN DENIED] Non-school email: ${userData.email}`)
            return res.status(403).json({ 
                error: '학교 계정으로 로그인해주세요.',
                message: '선린인터넷고등학교 이메일로만 로그인 가능합니다.'
            })
        }
        
        const userToken = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' })
        
        res.cookie('authToken', userToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax',
            maxAge: 3600000
        })
        
        console.log(`[LOGIN SUCCESS] User ${userData.name} (${userData.email}) logged in successfully`)
        
        res.status(200).json({
            message: '로그인에 성공했습니다.',
            user: {
                name: userData.name,
                email: userData.email,
                picture: userData.picture
            }
        })
    } catch (error) {
        console.error('[LOGIN ERROR] Google login error:', error)
        res.status(401).json({ 
            error: '로그인에 실패했습니다.',
            details: error.message 
        })
    }
})

app.get('/check-auth', authenticateToken, (req, res) => {
    res.json({
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture
    })
})

app.post('/logout', (req, res) => {
    res.clearCookie('authToken')
    console.log('[LOGOUT] User logged out successfully')
    res.status(200).json({ message: '로그아웃되었습니다.' })
})

function authenticateToken(req, res, next) {
    const token = req.cookies.authToken
    
    try {
        const user = jwt.verify(token, JWT_SECRET)
        req.user = user
        next()
    } catch (error) {
        console.log('[AUTH CHECK] Invalid token')
        res.status(403).json({ error: 'Invalid token' })
    }
}

app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`)
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app