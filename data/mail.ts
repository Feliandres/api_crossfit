import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Función para enviar correo de verificación
export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `http://crossfitquitoapi.com/new-verification?token=${token}`;

  try {
    const response = await resend.emails.send({
      from: 'no-reply@crossfitquitoapi.com', // Usa una dirección con tu dominio
      to: email,
      subject: 'Confirm your email',
      html: `<p>Click <a href='${confirmLink}'>here</a> to confirm your email</p>`,
    });
    console.log("Verification email sent:", response);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

// Función para enviar correo de reinicio de contraseña
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `http://crossfitquitoapi.com/new-password?token=${token}`;

  try {
    const response = await resend.emails.send({
      from: 'no-reply@crossfitquitoapi.com', // Usa una dirección con tu dominio
      to: email,
      subject: 'Reset your Password',
      html: `<p>Click <a href='${resetLink}'>here</a> to reset your password</p>`,
    });
    console.log("Password reset email sent:", response);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
