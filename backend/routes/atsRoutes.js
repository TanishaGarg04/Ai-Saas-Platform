import express from "express";
import multer from "multer";
import { checkATS } from "../controllers/atsController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/check", upload.single("resume"), checkATS);

export default router;