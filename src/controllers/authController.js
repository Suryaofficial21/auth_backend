import User from "../models/userModel.js"
import crypto from "crypto"
import { sendEmail } from "../utils/emailService.js"
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokenUtils.js"
import { trackLoginAttempt, resetLoginAttempts } from "../middleware/loginRateLimiter.js"
import { SOCKET_EVENTS, emitUserEvent } from "../utils/socketEvents.js"

export const register = async (req, res) => {
  try {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const verificationToken = crypto.randomBytes(20).toString("hex")

    const user = await User.create({
      email,
      password,
      verificationToken,
    })

   await emitUserEvent(req.io, SOCKET_EVENTS.USER_REGISTERED, { email: user.email })

    await sendEmail({
      to: email,
      subject: "Verify your email",
      template: "verificationEmail",
      templateVars: {
        verificationLink: `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`,
      },
    })

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      await trackLoginAttempt(email, false)
      return res.status(401).json({ message: "Invalid email or password" })
    }

    if (user.isLocked) {
      return res
        .status(401)
        .json({ message: "Account is locked due to too many failed attempts. Please reset your password." })
    }

    if (email === "admin@admin.com" && password === "admin@admin") {
      // For the default admin, skip email verification check
      if (!user.isActive) {
        return res.status(401).json({ message: "Your account has been disabled. Please contact an administrator." })
      }
    } else {
      if (!user.isVerified) {
        return res.status(401).json({ message: "Please verify your email before logging in" })
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Your account has been disabled. Please contact an administrator." })
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Save refresh token to database
    user.refreshToken = refreshToken
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await user.save()

    // Reset login attempts on successful login
    await trackLoginAttempt(email, true)

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" })
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)

    // Check if user exists and token matches
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken,
      refreshTokenExpiry: { $gt: new Date() },
    })

    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" })
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)

    // Update refresh token in database
    user.refreshToken = newRefreshToken
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await user.save()

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" })
  }
}

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body

    // Find user and remove refresh token
    const user = await User.findOneAndUpdate(
      { refreshToken },
      { $set: { refreshToken: null, refreshTokenExpiry: null } },
      { new: true },
    )

    if (user) {
      // Reset login attempts on logout
      resetLoginAttempts(user.email)
    }

    res.json({ message: "Logged out successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    const user = await User.findOne({ verificationToken: token })
    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" })
    }

    user.isVerified = true
    user.role = "authenticated"
    user.verificationToken = undefined
    await user.save()

    res.json({ message: "Email verified successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const resetToken = crypto.randomBytes(20).toString("hex")
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    await sendEmail({
      to: email,
      subject: "Password Reset",
      template: "resetPasswordEmail",
      templateVars: {
        resetLink: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
      },
    })

    res.json({ message: "Password reset email sent" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired" })
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ message: "Password has been reset" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const googleCallback = (req, res) => {
  const { _id, email, role } = req.user
  const accessToken = generateAccessToken(_id)
  const refreshToken = generateRefreshToken(_id)

  // Save refresh token to database
  User.findByIdAndUpdate(_id, {
    refreshToken,
    refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  }).exec()

  res.redirect(`${process.env.FRONTEND_URL}/auth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`)
}

