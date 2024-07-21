import nodemailer from "nodemailer";

// Configura el transporte de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "2525", 10), // Puerto por defecto 2525
  secure: process.env.EMAIL_SECURE === "true", // false para conexiones no seguras
  auth: {
    user: process.env.EMAIL_USER, // tu usuario SMTP
    pass: process.env.EMAIL_PASS, // tu contraseña SMTP
  },
});

// Función para enviar correo de verificación
export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `https://api-crossfit.vercel.app/new-verification?token=${token}`;

  const mailOptions = {
    from: `crossfitquito110@gmail.com`, // dirección del remitente
    to: email, // lista de destinatarios
    subject: "Confirm your email", // asunto
    html: `<p>Click <a href='${confirmLink}'>here</a> to confirm email</p>`, // cuerpo del correo en HTML
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

// Función para enviar correo de reinicio de contraseña
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `https://api-crossfit.vercel.app/new-password?token=${token}`;

  const mailOptions = {
    from: `crossfitquito110@gmail.com`, // dirección del remitente
    to: email, // lista de destinatarios
    subject: "Reset your Password", // asunto
    html: `<p>Click <a href='${resetLink}'>here</a> to reset password</p>`, // cuerpo del correo en HTML
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
