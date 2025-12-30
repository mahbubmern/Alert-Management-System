import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure storage
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(__dirname, "../../Files/Incoming/");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Configure upload middleware
export const uploadFiles = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
}).array('uploadFile', 5); // Accept up to 5 files 