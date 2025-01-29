import { verifyAccessToken } from "../utils/tokenUtils.js"
import User from "../models/userModel.js"

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (authHeader) {
    const token = authHeader.split(" ")[1]

    try {
      const decoded = verifyAccessToken(token)
      req.user = { id: decoded.id }
      next()
    } catch (error) {
      return res.status(403).json({ message: "Invalid or expired token" })
    }
  } else {
    next()
  }
}

export const protect = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized, no token" })
  }

  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role === "public") {
      return res.status(403).json({ message: "Access denied. Account not verified." })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403).json({ message: "Not authorized as an admin" })
  }
}

export const authenticated = (req, res, next) => {
  if (req.user && (req.user.role === "authenticated" || req.user.role === "admin")) {
    next()
  } else {
    res.status(403).json({ message: "Access denied. Authenticated users only." })
  }
}

