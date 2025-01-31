const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { promisify } = require("util");
const sharp = require("sharp");

const pipeline = promisify(require("stream").pipeline);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "uploads/";
    
    // Determine upload directory based on file type
    if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else if (file.mimetype.startsWith("audio/")) {
      uploadPath += "audio/";
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath += "video/";
    } else {
      uploadPath += "documents/";
    }

    // Create directory if it doesn't exist
    fs.mkdirSync(path.join(__dirname, "..", uploadPath), { recursive: true });
    cb(null, path.join(__dirname, "..", uploadPath));
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(6).toString("hex");
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    "image/jpeg": true,
    "image/png": true,
    "image/gif": true,
    "audio/mpeg": true,
    "audio/wav": true,
    "video/mp4": true,
    "application/pdf": true,
    "application/msword": true,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

class FileService {
  // Process image upload
  async processImage(file) {
    try {
      const thumbnailPath = path.join(
        path.dirname(file.path),
        "thumbnails",
        file.filename
      );

      // Create thumbnails directory if it doesn't exist
      fs.mkdirSync(path.dirname(thumbnailPath), { recursive: true });

      // Generate thumbnail
      await sharp(file.path)
        .resize(300, 300, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return {
        originalUrl: `/uploads/images/${file.filename}`,
        thumbnailUrl: `/uploads/images/thumbnails/${file.filename}`,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  }

  // Process audio upload
  async processAudio(file) {
    try {
      return {
        url: `/uploads/audio/${file.filename}`,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      throw error;
    }
  }

  // Process video upload
  async processVideo(file) {
    try {
      return {
        url: `/uploads/video/${file.filename}`,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error("Error processing video:", error);
      throw error;
    }
  }

  // Process document upload
  async processDocument(file) {
    try {
      return {
        url: `/uploads/documents/${file.filename}`,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error("Error processing document:", error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      await fs.promises.unlink(path.join(__dirname, "..", filePath));
      
      // If it's an image, also delete the thumbnail
      if (filePath.startsWith("/uploads/images/")) {
        const thumbnailPath = path.join(
          path.dirname(filePath),
          "thumbnails",
          path.basename(filePath)
        );
        await fs.promises.unlink(path.join(__dirname, "..", thumbnailPath));
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }
}

module.exports = {
  upload,
  fileService: new FileService(),
};
