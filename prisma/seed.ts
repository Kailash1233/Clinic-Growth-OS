import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin" },
    create: { email: adminEmail, role: "admin" },
  });

  console.log(`Seeded admin user: ${adminEmail} (sign in with OTP — check server logs for the dev code)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
