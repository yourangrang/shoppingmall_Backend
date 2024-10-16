const { default:mongoose } = require("mongoose");

const userSchema = mongoose.Schema({
    name:{
        type: String,
        maxLength: 50
    },
    emial:{
        type: String,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        minLength: 5
    },
    role: {
        type: Number,
        default: 0,
    },
    image: String
})