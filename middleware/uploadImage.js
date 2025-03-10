
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;

// import multer from "multer";
// import fs from "fs";
// import path from "path";

// // Ensure "uploads" folder exists
// const uploadDir = path.join(process.cwd(), "uploads");
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Storage engine
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/"); // Save in uploads folder
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname);
//     },
// });

// // File filter
// const fileFilter = (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//         cb(null, true);
//     } else {
//         cb(new Error("Invalid file type, only images allowed"), false);
//     }
// };

// const upload = multer({ storage, fileFilter });

// export default upload;
