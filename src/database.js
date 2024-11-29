const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')

const initializeDb = async () => {
    const db = await open({
        filename: path.join(__dirname, '../db.sqlite'),
        driver: sqlite3.Database
    })

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT UNIQUE,
            email TEXT UNIQUE,
            name TEXT,
            admission_year INTEGER,
            student_number INTEGER,
            grade INTEGER,
            class INTEGER,
            number INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `)

    await db.exec(`
        CREATE TABLE IF NOT EXISTS assignment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deadline DATETIME,
            
        )   
    `)

    return db
}

module.exports = { initializeDb }