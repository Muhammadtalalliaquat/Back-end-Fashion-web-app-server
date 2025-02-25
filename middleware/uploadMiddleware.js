
// import multer from "multer";


// const storage = multer.diskStorage({
//     destination: (req ,  file, cb) => {
//         cb(null, "uploads/");
//     },
//     filename: (req, file, cb) => {
//         cb(null , Date.now() + "-" + file.originalname)
//     },
// })

// const fileFilter = (req , res) => {
//     if(file.minetype.startsWith("image/")){
//         cb(null, true);
//     } else {
//         cb(new Error("Invalid file type"), false);
//     }
// }

// const uploads = multer({storage , fileFilter});

// export default uploads;


import multer from "multer";
import fs from "fs";
import path from "path";

// Ensure "uploads" folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save in uploads folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type, only images allowed"), false);
    }
};

const upload = multer({ storage, fileFilter });

export default upload;
