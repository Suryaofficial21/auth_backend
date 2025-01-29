import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["public", "authenticated", "admin"],
      default: "public",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    refreshTokenExpiry: {
      type: Date,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true },
)


userSchema.pre("save", async function (next) {

  if(this.email==="admin@gmail.com"){
  
    return next()
  }

  else if (!this.isModified("password")) return next()

  else
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword =  function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password)
}

const User = mongoose.model("User", userSchema)

export default User

