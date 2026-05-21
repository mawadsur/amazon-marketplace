// Promote an existing user to ADMIN by email or phone.
//
//   tsx scripts/promote-admin.ts user@example.com
//   tsx scripts/promote-admin.ts +919000000000
//
// There is no admin signup flow yet; this is the only way to mint an admin.

import { prisma } from "../src/lib/db";

function isEmail(identifier: string) {
  return identifier.includes("@");
}

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error("Usage: tsx scripts/promote-admin.ts <email|phone>");
    process.exit(1);
  }

  const where = isEmail(identifier) ? { email: identifier } : { phone: identifier };

  const before = await prisma.user.findUnique({
    where,
    select: { id: true, email: true, phone: true, name: true, role: true },
  });
  if (!before) {
    console.error(`No user found with ${isEmail(identifier) ? "email" : "phone"}=${identifier}`);
    process.exit(1);
  }

  console.log("BEFORE:", before);

  const after = await prisma.user.update({
    where: { id: before.id },
    data: { role: "ADMIN" },
    select: { id: true, email: true, phone: true, name: true, role: true },
  });

  console.log("AFTER: ", after);
  console.log(`\nPromoted user ${after.id} to ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
