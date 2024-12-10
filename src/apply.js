const express = require('express');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    const db = req.app.locals.db;
    const { name, phone_number, email, cover_letter, portfolio } = req.body;

    if (!name || !phone_number || !email || !cover_letter) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const loggedInUser = await db.get('SELECT id, name, email FROM users WHERE google_id = ?', [req.user.googleId]);

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (loggedInUser.name !== name || loggedInUser.email !== email) {
            return res.status(403).json({ 
                error: '이름과 이메일이 일치하지 않습니다. 보인 계정으로 로그인후 다시 시도해주시요' 
            });
        }

        await db.run(
            'INSERT INTO apply (user_id, name, phone_number, email, cover_letter, portfolio, applied_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [loggedInUser.id, name, phone_number, email, cover_letter, portfolio]
        );

        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Error submitting application:', error.message);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    const db = req.app.locals.db;

    try {
        const applications = await db.all('SELECT * FROM apply');
        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error.message);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    const db = req.app.locals.db;
    const applicationId = req.params.id;

    try {
        const application = await db.get('SELECT * FROM apply WHERE id = ?', [applicationId]);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.status(200).json(application);
    } catch (error) {
        console.error('Error fetching application:', error.message);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;