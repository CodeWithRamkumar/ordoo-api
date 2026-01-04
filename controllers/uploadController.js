const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Store for chunked uploads
const chunkStore = new Map();

// Single file upload
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'profile_images',
          transformation: [{ width: 400, height: 400, crop: 'fill' }],
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      public_id: result.public_id,
      url: result.secure_url
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// Chunked file upload
const uploadChunk = async (req, res) => {
  try {
    const { chunkIndex, totalChunks, uploadId, fileName } = req.body;
    const chunk = req.file;

    if (!chunk) {
      return res.status(400).json({ message: 'No chunk provided' });
    }

    // Initialize chunk store for this upload
    if (!chunkStore.has(uploadId)) {
      chunkStore.set(uploadId, {
        chunks: new Array(parseInt(totalChunks)),
        fileName,
        receivedChunks: 0
      });
    }

    const uploadData = chunkStore.get(uploadId);
    uploadData.chunks[parseInt(chunkIndex)] = chunk.buffer;
    uploadData.receivedChunks++;

    // If all chunks received, combine and upload
    if (uploadData.receivedChunks === parseInt(totalChunks)) {
      const completeFile = Buffer.concat(uploadData.chunks);
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'profile_images',
            transformation: [{ width: 400, height: 400, crop: 'fill' }],
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(completeFile);
      });

      // Clean up chunk store
      chunkStore.delete(uploadId);

      res.json({
        public_id: result.public_id,
        url: result.secure_url
      });
    } else {
      res.json({ message: 'Chunk received', progress: uploadData.receivedChunks / parseInt(totalChunks) });
    }
  } catch (error) {
    res.status(500).json({ message: 'Chunk upload failed', error: error.message });
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadChunk
};