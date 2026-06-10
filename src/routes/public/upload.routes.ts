import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { uploadToCloudinary } from "../../utils/cloudinary";

const router = Router();

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

router.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No image file provided" });
        return;
      }

      // Upload the buffer to Cloudinary
      const secureUrl = await uploadToCloudinary(req.file.buffer, "tableflow/branding");

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: { url: secureUrl },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
