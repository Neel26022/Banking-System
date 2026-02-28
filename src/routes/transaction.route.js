const { Router } = require("express");
const authMiddleware = require("../middlewares/auth.middleware")
const transactionController = require("../controller/transaction.controller")
/**
 *  - POST /api/transactions
 *  - Create a new transaction
*/

const transactionRoutes = Router()


transactionRoutes.post("/",authMiddleware,transactionController.createTransaction)

module.exports = transactionRoutes