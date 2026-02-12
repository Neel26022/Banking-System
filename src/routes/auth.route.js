const express = require("express")
const authController = require("../controller/auth.controller")

const router = express.Router()


/*POST /api/auth/register */
router.post("/register",authController.userRegisterController)

/*POST /api/auth/lgoin*/
router.post("/login", authController.userLoginController)
module.exports = router