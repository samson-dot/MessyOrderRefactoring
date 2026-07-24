import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { users } from "./users.js";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto"; 
import * as userRepo from "../repository/user.repo.js";

// loginnnnnnn

export const login = async (req, res) => {
  const { email, username, password } = req.body || {};

  // VALIDATION !!!!
  if (!password || (!email && !username)) {
    return res.status(400).json({
      error: "password and either email or username are required",
    });
  }

  // 2. types must be strings (reject numbers, objects, etc.)
  if (typeof password !== "string") {
    return res.status(400).json({ error: "password must be a string" });
  }
  if (email !== undefined && (typeof email !== "string" || !email.includes("@"))) {
    return res.status(400).json({ error: "email must be a valid email address" });
  }
  if (username !== undefined && typeof username !== "string") {
    return res.status(400).json({ error: "username must be a string" });
  }


  // match by email OR username — whichever the caller sent
  const user = users.find(
    (u) => (email && u.email === email) || (username && u.username === username)
  );
  // 2. check the typed password against the stored hash
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) {
    return res.status(401).json({ error: "invalid username or password" });
  }

  // 3. make a signed token that remembers who they are
  const token = jwt.sign(
    { id: user.id, role: user.role },   // payload: what the token carries
    config.JWT_SECRET,                  // secret: signs it so it can't be faked
    { expiresIn: "1h" }                 // token auto-expires after 1 hour
  );

  // 4. send the token back to the caller
  res.json({ token });
};


// Registering a user
// steps: validation -> check for duplicates -> hash password -> create user
export const register = async (req, res) => {
  const { email, username, password } = req.body || {};

  // 1. validate (same rules as login)
  if (!password || (!email && !username)) {
    return res.status(400).json({
      error: "password and either email or username are required",
    });
  }
  if (typeof password !== "string") {
    return res.status(400).json({ error: "password must be a string" });
  }

  // 2. reject duplicates
//   const exists = users.find(
//     (u) => (email && u.email === email) || (username && u.username === username)
//   );
  const exists = userRepo.findUser(email, username);  
  if (exists) {
    return res.status(409).json({ error: "user already exists" });
  }

  // 3. hash the password (never store plain text)
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. build the new user — role is ALWAYS "customer", never from the body
  const newUser = {
    id: randomUUID(),
    email: email || null,
    username: username || null,
    password: hashedPassword,
    role: "customer", // default role
  };
  
  userRepo.createUser(newUser);   

  // 6. respond — return safe fields only, NEVER the password
  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    role: newUser.role,
  });
};