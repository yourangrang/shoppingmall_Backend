const { default: mongoose } = require("mongoose");

const paymentSchema = mongoose.Schema({
    user: {
        type: Object
    },
    data: {
        type: Array,
        default: []
    },
    prodeuct: {
        type: Array,
        default: []
    },
}, { timestamps: true})

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;