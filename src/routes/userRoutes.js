import express from "express"
import { getProfile, updateProfile, changePassword } from "../controllers/userController.js"
import { protect, authenticated } from "../middleware/authMiddleware.js"
import { validateUpdateProfile, validateChangePassword, validate } from "../middleware/validationMiddleware.js"

const router = express.Router()

router.use(protect)
router.use(authenticated)

router.get("/profile", getProfile)
router.put("/profile", validateUpdateProfile, validate, updateProfile)
router.put("/change-password", validateChangePassword, validate, changePassword)

export default router

