

// on the authentication
Steps:
1. I installed the jwt token: npm install jsonwebtoken
2. I Added the jwt_secret to config
3. I created the auth/users.js
4. I then went on with the auth/auth.controller.js
5. Now trying the login in  route/http.js.
        import { login } from "../auth/auth.controller.js";
6. I then triggered login api on postman with the correct login details. 
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMxIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzg0Nzc3MDQyLCJleHAiOjE3ODQ3ODA2NDJ9.m8OjEesqiRhAzBxA2plkn31rMvW2-dPk_Zxou-TjJeo"
}

7. I then added the auth.middleware.js for authentication. To basically catch the token created. 
Then for each APIs, changed them from:
from this: app.post("/orders", requireKey, controller.createOrder);

To this: app.post("/orders", authenticate, controller.createOrder);

NOW REQUIRES AUTHENTICATION

8. Tested on Postman.
In the header field, I added 
Key: Authorization
Value: Bearer <token>

GET http://localhost:4000/orders/somid // order not found. 


9. Now I can drop this in my route/http.js. Not needed anymore:

const requireKey = (req, res, next) => {
  if (req.header("x-api-key") !== config.API_KEY)
    return res.status(401).json({ error: "unauthorized" });

  next();
};

10. Authorization. Admin shiitttt. 
Added the authorizatin export to auth.middleware.js

11. I Changed the changeStatus API to only changeable by Admin

From: app.patch("/orders/:id/status", authenticate, controller.changeStatus);

To: app.patch("/orders/:id/status", authenticate, authorize("admin"), controller.changeStatus);

12. TEST !!!!!
ADMIN TOKEN: 
{
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4NDc4MDM1NSwiZXhwIjoxNzg0NzgzOTU1fQ.-W5u8rE_uqteyM1WPLubGPFkYsI1cSbcREuYKji85rw"
}

ORDERID: "30a453d1-e78a-4f89-8ecd-ad6642725b06"

ADA TOKEN: 
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMxIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzg0NzgwNTI2LCJleHAiOjE3ODQ3ODQxMjZ9.iXzQwbzu9s4_y-79pyO0BbIULCVfM4taEoCw1PkMHqM"
}


13. Restricted access logged in customers have: order.controller.js ->> customerOrders
Before: Logged in customers could see another order that werent theirs
Now: Only admin can see all; and logged in customers can only see theirs


14. ByCRYPT!!! Encryption!!
A. Install bycrypt: npm install bcrypt
B. Created Bycrypt hash for Admin and Ada password: 
bcrypt.hashSync("ada123", 10) // I ran this in the terminal
C. replaced the PW: ada123 with the returned hashed PW
D. Adding bycrypt to auth.controller.js and changed:

export const login = (req, res) => {
  const { username, password } = req.body || {};
  // 1. find a user whose username AND password match
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  // 2. no match → reject
  if (!user) {
    return res.status(401).json({ error: "invalid username or password" });
  }.....}

to:
export const login = async (req, res) => {      
  const { username, password } = req.body || {}
  // 1. find the user by USERNAME only
  const user = users.find((u) => u.username === username);
  // 2. check the typed password against the stored hash
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) {
    return res.status(401).json({ error: "invalid username or password" });
  }....}

15. TESTED !!!!
Additional check: Ensured logged in customers cant see other orders in order.controller.js ->> getOrder 

Added: 
  if (req.user.role !== "admin" && order.customerId !== req.user.id) {
    return res.status(403).json({ error: "forbidden" });
  }

16. For now, to createOrder. 
We enter:{"customerId":"c1","customerName":"Ada","items":[{"sku":"BOOK","qty":1,"price":30}]}

which means a user can enter Admin instead of c1, and that is what is saved on the db. So what is done now is to add:
 b.customerId = req.user.id;
This ensures what is saved on the db is the user id and not the customerID sent at API. But that of the logged in person.

17. Went ahead to create my own cache. named the module: mycreatedcache.js

18. Added email to the signup in my authentication
so the step was simply done in the auth.controller.js

before:
const { username, password } = req.body || {};
const user = users.find((u) => u.username === username);

after:
const { email, username, password } = req.body || {};
const user = users.find(
  (u) => (email && u.email === email) || (username && u.username === username)
);

MEANWHILE,,,,,, I had added email to what make up my users.

19. VALIDATION !!!!!!
Ensured email, username and password are validated. Also, error for empty body is catched.