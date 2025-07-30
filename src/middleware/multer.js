const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists
const ensureDirectoryExistence = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = '';
        if (file.fieldname === "institute_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/institutes/');
        } else if (file.fieldname === "course_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/course/');
        } else if (file.fieldname === "hostel_list_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/hostel_list/');
        }else if (file.fieldname === "ban_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/guestBanner/');
        }else if (file.fieldname === "testimonial_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/guestTestimonials/');
        }else if (file.fieldname === "howitworks_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/guestHowitworks/');
        }else if (file.fieldname === "blog_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/guestBlogs/');
        }else if (file.fieldname === "blog_video") {
            folder =  path.resolve(process.cwd(), 'public/uploads/guestBlogs/');
        }else if (file.fieldname === "about_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/guestAbout/');
        }else if (file.fieldname === "service_image") {
            folder =  path.resolve(process.cwd(), 'public/uploads/guestService/');
        }else {
            folder =  path.resolve(process.cwd(), 'public/uploads/others/');
        }
        ensureDirectoryExistence(folder);  // Ensure folder exists
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}_${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
   // limits: { fileSize: 5000000 }, // 5MB file size limit
   limits: { fileSize: 50000000 },
    fileFilter: (req, file, cb) => {
        // const filetypes = /jpeg|jpg|png/;
        const filetypes = /jpeg|jpg|png|mp4|mov|avi/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Only images or videos or aboutImages are allowed!');
        }
    }
}).fields([
    { name: 'institute_image', maxCount: 1 },
    { name: 'course_image', maxCount: 1 },
    { name: 'ban_image', maxCount:1},
    { name: 'testimonial_image', maxCount:1},
    { name: 'howitworks_image', maxCount:1},
    { name: 'blog_image', maxCount:1},
    { name: 'blog_video', maxCount:1},
    { name: 'about_image', maxCount:1},
    { name: 'service_image', maxCount:1},
]);

module.exports = upload;
