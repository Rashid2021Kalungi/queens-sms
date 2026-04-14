import bcrypt from "bcrypt";

const pwd = process.argv[2];
if (!pwd) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(pwd, 12);
console.log(hash);
