import { Server } from "socket.io"
import jwt from "jsonwebtoken"

const configureSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:"*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token

    if (!token) {
      return next(new Error("Authentication error: No token provided"))
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      socket.user = decoded
      next()
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"))
    }
  })

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`)

    // Join admin room if user is admin
    if (socket.user && socket.user.role === "admin") {
      socket.join("admins")
      console.log(`Admin joined: ${socket.id}`)
    }

    // Handle user events
    socket.on("userEvent", (data) => {
      io.to("admins").emit("userUpdate", data)
    })

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`)
    })

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error: ${error}`)
    })
  })

  return io
}

export default configureSocket