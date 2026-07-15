// sockets/supportSocket.js
const Message = require('../models/Message');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('⚡ A user connected to WebSockets:', socket.id);

        // EVENT 1: Join Room & Fetch History
        socket.on('join-support-room', async (userId) => {
            socket.join(userId);
            console.log(`User joined private support room: ${userId}`);

            try {
                // Fetch all previous messages for this user from MongoDB
                const chatHistory = await Message.find({ roomId: userId }).sort({ createdAt: 1 });
                
                // Send the history back to the user's screen instantly
                socket.emit('chat-history', chatHistory);
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        });

        // EVENT 2: Handle New Message & Save to DB
        socket.on('send-support-message', async (messageData) => {
            try {
                // 1. Save the new message to MongoDB permanently
                const newMessage = await Message.create({
                    roomId: messageData.roomId,
                    senderId: messageData.senderId,
                    senderName: messageData.senderName,
                    text: messageData.text,
                    isAdmin: messageData.isAdmin
                });

                // 2. Broadcast the saved message to everyone in the room (including the sender!)
                io.to(messageData.roomId).emit('receive-support-message', newMessage);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        // EVENT 3: Global Broadcast (Admin Only)
        socket.on('admin-broadcast', (broadcastData) => {
            io.emit('receive-broadcast', broadcastData);
        });

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id);
        });
    });
};