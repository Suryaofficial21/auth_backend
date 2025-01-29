import User from "../models/userModel.js"

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.email = email || user.email
    await user.save()

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!( user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    user.password = newPassword
    await user.save()

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

