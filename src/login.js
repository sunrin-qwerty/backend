const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
)

async function handleGoogleLogin(req, res, db) {
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
                number: userData.number
            }
        })
    } catch (error) {
        console.error('[LOGIN ERROR]:', error)
        res.status(401).json({ 
            error: '로그인에 실패했습니다.',
            details: error.message 
        })
    }
}

module.exports = { handleGoogleLogin }