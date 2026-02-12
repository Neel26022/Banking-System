const mongoose = require("mongoose")

function ConnectToDB() {
    console.log(process.env.MONGODB_URI)
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Server is connected to DB")
    })
    .catch(err => {
        console.log("Error Connecting to DB", err)
        process.exit(1)
    })
}

module.exports = ConnectToDB