const express = require('express')
const cookieParser = require("cookie-parser")
const app = express()

app.use(express.json())
app.use(cookieParser())

/**
 * - Routes Required
 */
const authRouter = require("./routes/auth.route")
const accountRouter = require("./routes/account.route")

/**
 * - User Routes
 */
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)

app.get("/", (req, res) => {
    res.send("Welcome to the Banking API")
})
module.exports = app