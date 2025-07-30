const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: 'dqii0d6ij',
  api_key: '851454644529249',
  api_secret: 'ovm2PQ42RivUFmAZT52tNfMzP2Y',
  secure: true
});

const uploadToCloudinary = async (filePath, folderPath, options = {}) => {
  const defaultOptions = {
    folder: folderPath,
    resource_type: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  };

  return await cloudinary.uploader.upload(filePath, defaultOptions);
};

const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

const generateTransformations = (width, height, crop = 'fill') => {
  return cloudinary.url('', {
    width,
    height,
    crop,
    quality: 'auto',
    fetch_format: 'auto'
  });
};

module.exports = { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  generateTransformations 
};