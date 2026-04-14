import "./loadBackendEnv.js";
import bcrypt from "bcrypt";
import { loadConfig } from "../src/config.js";
import { setupDatabase, User } from "../src/models/index.js";

const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@gmail.com").trim();
const password = process.env.SEED_ADMIN_PASSWORD ?? "admin@123";

async function main() {
  const config = loadConfig();
  const sequelize = setupDatabase(config);
  await sequelize.authenticate();

  const passwordHash = await bcrypt.hash(password, 12);

  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      passwordHash,
      role: "admin",
    },
  });

  if (!created) {
    await user.update({ passwordHash, role: "admin" });
    console.log(`Updated admin user: ${email}`);
  } else {
    console.log(`Created admin user: ${email}`);
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
