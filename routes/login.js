const express = require('express')
const router = express.Router()
const sqlite3 = require('sqlite3').verbose()

const pool = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        return console.error(err.message)
    }
})