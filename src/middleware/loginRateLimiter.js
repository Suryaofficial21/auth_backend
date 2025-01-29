import rateLimit from "express-rate-limit"
import User from "../models/userModel.js"

const loginAttempts = new Map()

export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again after 15 minutes",
  keyGenerator: (req) => req.body.email, // Use email as the key
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many login attempts, please try again after 15 minutes",
    })
  },
  skip: (req, res) => {
    // Skip rate limiting for successful logins
    return req.rateLimit && req.rateLimit.current <= 5
  },
})

export const trackLoginAttempt = async (email, success) => {
  if (!loginAttempts.has(email)) {
    loginAttempts.set(email, { count: 0, lastAttempt: Date.now() })
  }

  const attempt = loginAttempts.get(email)

  if (success) {
    // Reset attempts on successful login
    loginAttempts.set(email, { count: 0, lastAttempt: Date.now() })
  } else {
    // Increment attempts on failed login
    attempt.count += 1
    attempt.lastAttempt = Date.now()
    loginAttempts.set(email, attempt)

    if (attempt.count >= 5) {
      // Lock the account if 5 or more failed attempts
      await User.findOneAndUpdate({ email }, { isLocked: true })
    }
  }
}

export const resetLoginAttempts = (email) => {
  loginAttempts.delete(email)
}

