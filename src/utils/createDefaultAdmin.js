import User from "../models/userModel.js"
import bcrypt from "bcryptjs"

const createDefaultAdmin = async () => {
  try {
    const adminEmail = "admin@gmail.com"
    const adminPassword = "admin1234"

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail })

    if (!existingAdmin) {
      // Create new admin user
      console.log(adminEmail,adminPassword)
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      const user=new User({
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        isActive: true,
      })
      await user.save()
      console.log(await bcrypt.compare(adminPassword, hashedPassword))
      console.log(adminPassword,hashedPassword)
      console.log("Default admin user created successfully")
    } else {
      console.log("Default admin user already exists")
    }
  } catch (error) {
    console.error("Error creating default admin user:", error)
  }
}

export default createDefaultAdmin

