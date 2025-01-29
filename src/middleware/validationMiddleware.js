import { body, param, validationResult } from "express-validator"

export const validateRegistration = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
]

export const validateLogin = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

export const validateForgotPassword = [body("email").isEmail().withMessage("Please enter a valid email")]

export const validateResetPassword = [
  param("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
]

export const validateUpdateProfile = [body("email").isEmail().withMessage("Please enter a valid email")]

export const validateChangePassword = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("New password must contain a number"),
]

export const validateUpdateUser = [
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("role").optional().isIn(["public", "authenticated", "admin"]).withMessage("Invalid role"),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  body("email").optional().isEmail().withMessage("Invalid email address"),
]

export const validateResetUserPassword = [
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
]

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  const extractedErrors = []
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }))

  return res.status(422).json({
    errors: extractedErrors,
  })
}

