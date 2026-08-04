/**
 * Interactively resets the password for an existing admin account.
 *
 * Run: npm run reset-password
 */
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "blog.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
`);

// Same username backfill + unique-index migration as src/lib/db.ts, in case
// this script runs against an existing DB before the app has started once.
const adminCols = db.prepare("PRAGMA table_info(admin)").all();
if (!adminCols.some((c) => c.name === "username")) {
  db.exec("ALTER TABLE admin ADD COLUMN username TEXT NOT NULL DEFAULT ''");
}
const blankUsernames = db.prepare("SELECT id, email FROM admin WHERE username = ''").all();
if (blankUsernames.length > 0) {
  const taken = new Set(db.prepare("SELECT username FROM admin WHERE username != ''").all().map((r) => r.username));
  const updateUsername = db.prepare("UPDATE admin SET username = ? WHERE id = ?");
  for (const row of blankUsernames) {
    const base = row.email.split("@")[0];
    let candidate = base;
    let n = 2;
    while (taken.has(candidate)) candidate = `${base}${n++}`;
    taken.add(candidate);
    updateUsername.run(candidate, row.id);
  }
}
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS admin_username_unique ON admin(username)");

function ask(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (answer) => { rl.close(); resolve(answer.trim()); }));
}

// Hidden input for passwords — no library added, just raw stdin with echo off.
function askHidden(query) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(query);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let input = "";
    function onData(char) {
      if (char === "\n" || char === "\r" || char === "") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
        return;
      }
      if (char === "") {
        process.stdout.write("\n");
        process.exit(1);
      }
      if (char === "" || char === "\b") {
        input = input.slice(0, -1);
        return;
      }
      input += char;
    }
    stdin.on("data", onData);
  });
}

async function main() {
  const admins = db.prepare("SELECT id, username, email FROM admin ORDER BY id").all();
  if (admins.length === 0) {
    console.error("No admin accounts exist yet. Run `npm run create-admin` first.");
    process.exit(1);
  }
  console.log("Existing admins:");
  admins.forEach((a) => console.log(`  ${a.email}${a.username ? ` (${a.username})` : ""}`));

  const email = await ask("Email of the admin to reset: ");
  const admin = db.prepare("SELECT id FROM admin WHERE email = ?").get(email);
  if (!admin) {
    console.error(`No admin found with email ${email}.`);
    process.exit(1);
  }

  const password = await askHidden("New password (min 8 characters): ");
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const confirm = await askHidden("Confirm new password: ");
  if (confirm !== password) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare("UPDATE admin SET password_hash = ? WHERE id = ?").run(hash, admin.id);
  console.log(`Password updated for ${email}.`);
}

main();
