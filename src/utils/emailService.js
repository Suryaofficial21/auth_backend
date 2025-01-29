import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendEmail = async (options) => {
  const templatePath = path.join(__dirname, "..", "templates", `${options.template}.html`)
  let html = fs.readFileSync(templatePath, "utf8")

  // Replace placeholders in the template
  for (const [key, value] of Object.entries(options.templateVars)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value)
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: html,
  }

  await transporter.sendMail(mailOptions)
}

export { sendEmail }

