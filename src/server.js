import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { createServer } from "http"
import passport from "./config/passport.js"
import connectDB from "./config/database.js"
import configureSocket from "./config/socket.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import { errorHandler } from "./middleware/errorMiddleware.js"
import { authenticateJWT } from "./middleware/authMiddleware.js"
import createDefaultAdmin from "./utils/createDefaultAdmin.js"
import { loginRateLimiter } from "./middleware/loginRateLimiter.js"

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()
const httpServer = createServer(app)

// Connect to MongoDB
connectDB()

// Configure Socket.IO
const io = configureSocket(httpServer)

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],}),
)
app.use(express.json())
app.use(authenticateJWT)

// Initialize Passport
app.use(passport.initialize())

// Make io available to routes
app.use((req, res, next) => {
  req.io = io
  next()
})

// Apply login rate limiter to /api/auth/login route
app.use("/api/auth/login", loginRateLimiter)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/admin", adminRoutes)

// Error handling
app.use(errorHandler)

// Create default admin user
createDefaultAdmin()

// Start server
const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Error: ${err.message}`)
  // Close server & exit process
  httpServer.close(() => process.exit(1))
})

