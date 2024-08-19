// pages/api/emails.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const remitentePermitido = "no-reply@crossfitquitoapi.com";
const dominioBloqueado = "@mms.att.net";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token requerido' });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      // Verificar el token JWT
      const decoded = jwt.verify(token, jwtSecret);
      if (!decoded) {
        return res.status(403).json({ message: 'Token no válido' });
      }

      // Extraer datos del cuerpo de la solicitud
      const { from, to, subject, html } = req.body;

      // Validar el remitente
      if (from !== remitentePermitido) {
        return res.status(403).json({ message: `El remitente solo puede ser ${remitentePermitido}` });
      }

      // Validar el destinatario
      if (to.endsWith(dominioBloqueado)) {
        return res.status(403).json({ message: `No se permite enviar correos al dominio ${dominioBloqueado}` });
      }

      // Enviar el correo
      const response = await resend.emails.send({
        from: from,
        to: to,
        subject: subject,
        html: html,
      });

      res.status(200).json({ message: 'Correo enviado exitosamente', response });
    } catch (error) {
      res.status(500).json({ message: 'Error al enviar el correo', error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
