import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Función para validar el destinatario y remitente antes de enviar el correo
const validarCorreo = (email: string, from: string) => {
  const dominioBloqueado = "@mms.att.net";
  const remitentePermitido = "no-reply@crossfitquitoapi.com";

  // Validar que el destinatario no tenga el dominio bloqueado
  if (email.endsWith(dominioBloqueado)) {
    throw new Error(`No se permite enviar correos al dominio ${dominioBloqueado}`);
  }

  // Validar que el remitente sea el permitido
  if (from !== remitentePermitido) {
    throw new Error(`El remitente solo puede ser ${remitentePermitido}`);
  }
};

// Función para enviar correo de verificación
export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `https://crossfit-app-beta.vercel.app/new-verification?token=${token}`;
  const from = 'no-reply@crossfitquitoapi.com';

  try {
    validarCorreo(email, from); // Llama a la función de validación antes de enviar
    const response = await resend.emails.send({
      from: from,
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
  const resetLink = `https://crossfit-app-beta.vercel.app/new-password?token=${token}`;
  const from = 'no-reply@crossfitquitoapi.com';

  try {
    validarCorreo(email, from); // Llama a la función de validación antes de enviar
    const response = await resend.emails.send({
      from: from,
      to: email,
      subject: 'Reset your Password',
      html: `<p>Click <a href='${resetLink}'>here</a> to reset your password</p>`,
    });
    console.log("Password reset email sent:", response);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
