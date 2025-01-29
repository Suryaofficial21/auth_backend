import User from "../models/userModel.js"
import { SOCKET_EVENTS, emitUserEvent } from "../utils/socketEvents.js"
import bcrypt from "bcryptjs"

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { role, isActive, email } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (role !== undefined) user.role = role
    if (isActive !== undefined) user.isActive = isActive
    if (email !== undefined) user.email = email

    await user.save()

    // Emit socket event
    emitUserEvent(req.io, SOCKET_EVENTS.USER_UPDATED, {
      userId: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })

    res.json({ message: "User updated successfully", user })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params
    const { newPassword } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.password = newPassword
    await user.save()

    // Emit socket event
    emitUserEvent(req.io, SOCKET_EVENTS.USER_PASSWORD_RESET, {
      userId: user._id,
      email: user.email,
    })

    res.json({ message: "User password reset successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const changeDefaultAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const adminUser = await User.findOne({ email: "admin@admin.com" })
    if (!adminUser) {
      return res.status(404).json({ message: "Default admin user not found" })
    }

    const isMatch = await adminUser.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    adminUser.password = await bcrypt.hash(newPassword, 12)
    await adminUser.save()

    // Emit socket event
    emitUserEvent(req.io, SOCKET_EVENTS.ADMIN_PASSWORD_CHANGED, {
      message: "Default admin password has been changed",
    })

    res.json({ message: "Default admin password changed successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export default {
  getAllUsers,
  updateUser,
  resetUserPassword,
  changeDefaultAdminPassword,
}

