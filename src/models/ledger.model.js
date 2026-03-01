const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Ledger entry must be associated with an account"],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, "Ledger entry must have an amount"],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Ledger entry must be associated with a transaction"],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ["DEBIT", "CREDIT"],
            message: "Ledger entry type can be either DEBIT or CREDIT",
        },
        required: [true, "Ledger entry type is required"],
        immutable: true
    }
}, {
    timestamps: true
})


function preventLederModification(next) {
    throw new Error("Ledger entries cannot be modified or deleted")
}

ledgerSchema.pre('findOneAndUpdate', preventLederModification)
ledgerSchema.pre('updateOne', preventLederModification)
ledgerSchema.pre('deleteOne', preventLederModification)
ledgerSchema.pre('updateMany', preventLederModification)
ledgerSchema.pre('deleteMany', preventLederModification)

const ledgerModel = mongoose.model("ledger", ledgerSchema)

module.exports = ledgerModel
