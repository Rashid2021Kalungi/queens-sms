import "dotenv/config";
import { loadConfig } from "../src/config.js";
import {
  setupDatabase,
  User,
  UserMessage,
  UserNotification,
} from "../src/models/index.js";

const email = (process.env.SEED_INBOX_USER_EMAIL ?? "admin@gmail.com").trim();

const NOTIFICATIONS: { title: string; body: string; unread: boolean; ageMs: number }[] = [
  {
    title: "Staff meeting",
    body: "Friday 3:00 PM — term reports and attendance policy.",
    unread: true,
    ageMs: 12 * 60_000,
  },
  {
    title: "Fee statements",
    body: "Term 2 statements will be published next week.",
    unread: true,
    ageMs: 60 * 60_000,
  },
  {
    title: "Sports day",
    body: "Volunteers needed for the scoring desk.",
    unread: true,
    ageMs: 3 * 60 * 60_000,
  },
  {
    title: "Library inventory",
    body: "Annual stock check scheduled for Block B.",
    unread: false,
    ageMs: 1 * 86400_000,
  },
  {
    title: "System maintenance",
    body: "Portal may be unavailable Sunday 2:00–4:00 AM.",
    unread: false,
    ageMs: 2 * 86400_000,
  },
];

const MESSAGES: { title: string; body: string; unread: boolean; ageMs: number }[] = [
  {
    title: "Mrs. Okello",
    body: "Please confirm P.4 field trip headcount by Thursday.",
    unread: true,
    ageMs: 8 * 60_000,
  },
  {
    title: "Accounts office",
    body: "Petty cash voucher EXP-1041 awaiting your signature.",
    unread: true,
    ageMs: 25 * 60_000,
  },
  {
    title: "Head Teacher",
    body: "Draft timetable changes for next term attached in SMS.",
    unread: true,
    ageMs: 60 * 60_000,
  },
  {
    title: "Transport",
    body: "Bus route 2 running 15 minutes late this morning.",
    unread: true,
    ageMs: 2 * 60 * 60_000,
  },
  {
    title: "Parent — Nambi",
    body: "Requesting appointment regarding learner attendance.",
    unread: false,
    ageMs: 4 * 60 * 60_000,
  },
  {
    title: "IT support",
    body: "Your printer queue on Floor 2 has been cleared.",
    unread: false,
    ageMs: 6 * 60 * 60_000,
  },
  {
    title: "Store",
    body: "Science kits delivery signed off — 12 boxes.",
    unread: false,
    ageMs: 86400_000,
  },
  {
    title: "Deputy",
    body: "Reminder: submit class observation forms by month end.",
    unread: false,
    ageMs: 2 * 86400_000,
  },
];

async function main() {
  const config = loadConfig();
  const sequelize = setupDatabase(config);
  await sequelize.authenticate();

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email}. Run npm run seed:admin first.`);
    process.exit(1);
  }

  const userId = user.id;
  const now = Date.now();

  await UserNotification.destroy({ where: { userId } });
  await UserMessage.destroy({ where: { recipientUserId: userId } });

  for (const n of NOTIFICATIONS) {
    const createdAt = new Date(now - n.ageMs);
    await UserNotification.create({
      userId,
      title: n.title,
      body: n.body,
      readAt: n.unread ? null : new Date(now - n.ageMs + 60_000),
      createdAt,
    });
  }

  for (const m of MESSAGES) {
    const createdAt = new Date(now - m.ageMs);
    await UserMessage.create({
      recipientUserId: userId,
      senderUserId: null,
      title: m.title,
      body: m.body,
      readAt: m.unread ? null : new Date(now - m.ageMs + 60_000),
      createdAt,
    });
  }

  console.log(
    `Seeded ${NOTIFICATIONS.length} notifications and ${MESSAGES.length} messages for ${email} (user id ${userId}).`,
  );

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
