import Database from "better-sqlite3";
import { config } from "../config/config.js";

const db = new Database(config.DB_FILE);

// create the users table if it doesn't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  );
`);

// INSERT a new user
export const createUser = (user) => {
  db.prepare(
    `INSERT INTO users (id, username, email, password, role) VALUES (?,?,?,?,?)`
  ).run(user.id, user.username, user.email, user.password, user.role);
};

// find a user by email OR username (for login / duplicate checks)
export const findUser = (email, username) => {
  return db.prepare(
    `SELECT * FROM users WHERE email = ? OR username = ?`
  ).get(email ?? null, username ?? null);
};
