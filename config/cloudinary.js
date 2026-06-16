const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 🚨 TEMPORARY HARDCODE TEST 🚨
// We are bypassing process.env completely to see if Render is the liar.
cloudinary.config({
  cloud_name: 'dlhaf1209',
  api_key: '929555886865578',
  api_secret: 'K026hMXNEEGF_RCMNSTMBh5EQIU',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'prepmate_avatars', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };