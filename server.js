const express = require('express')
const http = require('http')
const sqlite3 = require('sqlite3').verbose()

const app = express()
const PORT = 3000

const login = require('./routes/login.js')

app.get('/', (req, res) => {
    res.send('Hello World')
})


http.createServer(app).listen(PORT, () => {
    console.log(`Server URL : http://localhost:${PORT}`)
})