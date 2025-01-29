import express from "express"
import passport from "passport"
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  googleCallback,
} from "../controllers/authController.js"
import {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validate,
} from "../middleware/validationMiddleware.js"

const router = express.Router()

router.post("/register", validateRegistration, validate, register)
router.post("/login", validateLogin, validate, login)
router.post("/refresh-token", refreshToken)
router.post("/logout", logout)
router.get("/verify-email/:token", verifyEmail)
router.post("/forgot-password", validateForgotPassword, validate, forgotPassword)
router.post("/reset-password/:token", validateResetPassword, validate, resetPassword)

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleCallback,
)

export default router

