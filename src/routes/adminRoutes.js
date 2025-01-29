import express from "express"
import {
  getAllUsers,
  
  resetUserPassword,
  changeDefaultAdminPassword,
  updateUser,
} from "../controllers/adminController.js"
import { protect, admin } from "../middleware/authMiddleware.js"
import {
  validateResetUserPassword,
  validate,
  validateUpdateUser,
} from "../middleware/validationMiddleware.js"

const router = express.Router()

router.use(protect)
router.use(admin)

router.get("/users", getAllUsers)
router.put("/users/:userId", validateUpdateUser, validate, updateUser)
router.put("/users/:userId/reset-password", validateResetUserPassword, validate, resetUserPassword)

export default router

