import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { users } from "./users.js";
import bcrypt from "bcrypt";

export const login = async (req, res) => {      
  const { username, password } = req.body || {}
  // 1. find the user by USERNAME only
  const user = users.find((u) => u.username === username);
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