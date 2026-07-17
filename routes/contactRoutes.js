const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact'); // Adjust this path if your models folder is elsewhere


router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required.' 
      });
    }

    // Save to database
    const newMessage = await Contact.create({ name, email, message });
    
    res.status(201).json({ 
      success: true, 
      data: newMessage,
      message: 'Message sent successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/', async (req, res) => {
  try {
    // Fetch all messages and sort by newest first (-1)
    const messages = await Contact.find().sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: messages.length,
      data: messages 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;