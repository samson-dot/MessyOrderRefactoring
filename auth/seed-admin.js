import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import * as userRepo from "../repository/user.repo.js";

// the admin's login details
const email = process.env.ADMIN_EMAIL;
const username = process.env.ADMIN_USERNAME;
const plainPassword = process.env.ADMIN_PASSWORD;

// don't create a duplicate if it's already there
const existing = userRepo.findUser(email, username);
if (existing) {
  console.log("Admin already exists — nothing to do.");
} else {
  userRepo.createUser({
    id: randomUUID(),
    username,
    email,
    password: bcrypt.hashSync(plainPassword, 10),   // hash it, like register does
    role: "admin",                                   // ← the whole point: role = admin
  });
}