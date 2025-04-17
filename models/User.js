const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    serverId: {
        type: String,
        required: true
    },
    commandCount: {
        type: Number,
        default: 0
    },
    inventario: Array
});

module.exports = mongoose.model("User", userSchema);