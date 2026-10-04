import { prisma } from "../../lib/prisma.js";
import { verifyPassword } from "../../lib/password.js";

export async function authenticateUser({ username, password }) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      passwordHash: true,
      isActive: true,
      station: {
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!user || !user.isActive || !user.station.isActive) {
    return null;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    station: {
      id: user.station.id,
      code: user.station.code,
      name: user.station.name,
    },
  };
}
