// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // The "Room" is just the Student's specific ID
    roomId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    senderName: { 
        type: String, 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    },
    isAdmin: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true }); // Automatically creates 'createdAt' for sorting messages

module.exports = mongoose.model('Message', messageSchema);