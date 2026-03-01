const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const accountModel = require('../models/account.model') 
const emailService = require('../services/email.service')

const mongoose = require('mongoose')

async function createTransaction(req, res) {
 
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if(!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({ error: "Missing required fields: fromAccount, toAccount, amount, idempotencyKey" })
    }

    const fromAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if(!fomAccount || !toAccount) {
        return res.status(400).json({ error: "One or both accounts not found" })
    }   


    /**
     * - 2. Validate idempotency key
     */

    const isTransactionExist = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionExist) {
        if(isTransactionExist.status === "COMPLETED") {
            res.status(200).json({
                message: "Transaction already completed",
                transaction: isTransactionExist
            })
        }

        if(isTransactionExist.status === "PENDING") {
            res.status(200).json({ 
                message: "Transaction is still pending",
                transaction: isTransactionExist
            })
        }

        if(isTransactionExist.status === "FAILED") {
            res.status(500).json({
                message: "Previous transaction attempt failed, you can retry",
                transaction: isTransactionExist
            })
        }

        if(isTransactionExist.status === "REVERSED") {
            res.status(500).json({
                message: "Previous transaction was reversed",
                transaction: isTransactionExist
            })
        }
    }

    /**
     *  - 3. Check accoutn status
     */

    if(fromAccount.status !== "ACTIVE" || toAccount.status !== "ACTIVE") {
        return res.status(400).json({ message: "One or both accounts are not active" })
    }

    /**
     * - 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBlance()

    if(balance < amount) {
        return res.status(400).json({ message: `Insufficient balance in sender account. Available balance: ${balance}` })
    }

    /**
     * - 5. Create transaction PANDING
     */

    const session = await mongoose.startSession()
    session.StartTransaction()

    const transactionModel = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    },{session})


    const creditLedgerEntry = await ledgerModel.create({
        account: toAccount._id,
        amount,
        transaction: transactionModel._id,
        type: "CREDIT"
    }, { session }) 

    const debitLedgerEntry = await ledgerModel.create({
        account: fromAccount._id,
        amount,
        transaction: transactionModel._id,
        type: "DEBIT"
    }, { session })

    transactionModel.status = "COMPLETED"
    await transactionModel.save({ session })

    await session.commitTransaction()
    session.endSession()

    /**
     * - 10. Send email notification 
     */

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount._id)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transactionModel
    }) 
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })


}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}