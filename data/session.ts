import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';
import { getUserById } from '@/data/user';

export async function getUserSession(req: Request) {
    // Verifica que exista la variable en el archivo .env
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
    }

    // Obtiene el token de desde los headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: "Token not provided", status: 401 };
    }

    // Obtiene el solo el token
    const token = authHeader.split(' ')[1];

    // Decodifica el token para ver el usuario
    let decodedToken;
    try {
        decodedToken = verify(token, jwtSecret);
    } catch (error) {
        return { error: "Invalid token", status: 401 };
    }

    if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
        return { error: "Invalid token", status: 401 };
    }

    // Obtiene el Id del usuario
    const userId = decodedToken.userId;

    // Busca la sesion del usuario en base al token
    const session = await prisma.session.findFirst({
        where: {
            sessionToken: token,
        },
    });

    if (!session) {
        return { error: "Session not found", status: 404 };
    }

    // Verifica que exista el usuario
    const existingUser = await getUserById(userId);

    if (!existingUser) {
        return { error: "User not found", status: 404 };
    }

    // Verifica que la sesion no esta expirada
    const currentTime = new Date();
    if (session.expires < currentTime) {
        return { error: "Session expired", status: 401 };
    }

    return { user: existingUser, token, status: 200 };
}

// Función auxiliar para obtener y verificar la sesión del usuario
export async function getSessionAndValidateRole(req: Request) {
    const { user, token, error, status } = await getUserSession(req);

    if (error) {
        return { error, status };
    }

    if (!user) {
        return { error: "Unauthorized", status: 403 };
    }

    return { user, token, status: 200 };
}