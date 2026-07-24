## Authentication & Authorization Layer
Replaced the shared x-api-key with JWT-based auth: per-user identity, roles, hashed passwords, and ownership checks.

### Authentication (JWT)
Added JWT_SECRET, auth/users.js, auth/auth.controller.js (login → signed token), and auth/auth.middleware.js (authenticate → sets req.user).
Added public POST /login; protected all order routes with authenticate; removed the old requireKey.

### Authorization (roles)
authorize(...roles) middleware; status changes are now admin-only:
app.patch("/orders/:id/status",  
authenticate, authorize("admin"),  
controller.changeStatus).  

### Password security (bcrypt)
Passwords stored as bcrypt hashes; login is now async and verifies with bcrypt.compare instead of ===.  

### Ownership checks
getOrder: customers see only their own orders (admins any).  
customerOrders: customers scoped to themselves; admins can look up anyone.   
createOrder: owner taken from the token (b.customerId = req.user.id), not the request body.  
Fixes: shared key → per-user roles · IDOR on reads → ownership enforced · spoofable order owner → set from token · plain passwords → hashed.

### Added User Registration & Login
Register/login by email or username with bcrypt-hashed passwords in a users table. 
Signups default to customer; admins are seeded separately, secrets in .env.
