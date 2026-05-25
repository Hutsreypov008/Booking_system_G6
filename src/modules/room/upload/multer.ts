import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const MAX_ROOM_IMAGES = 5;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const roomImageUploadDir = path.join(process.cwd(), "uploads", "rooms");

// Create upload folder if it does not exist
if (!fs.existsSync(roomImageUploadDir)) {
  fs.mkdirSync(roomImageUploadDir, { recursive: true });
}

// Choose where images will be saved
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, roomImageUploadDir);
  },

  // Create unique image filename
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueFileName);
  },
});

// Allow only image files
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image files are allowed"));
    return;
  }
  cb(null, true);
};

// Multer setting for room image upload
export const uploadRoomImages = multer({
  storage,
  fileFilter,
  limits: {
    files: MAX_ROOM_IMAGES,
    fileSize: MAX_IMAGE_SIZE,
  },
});
