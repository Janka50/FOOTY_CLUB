require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');

cloudinary.api.ping()
  .then(() => console.log("Cloudinary connected"))
  .catch(console.error);
