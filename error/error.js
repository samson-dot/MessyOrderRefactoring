
export const errorHandler = (err, req, res, next) => {
  console.error("Something failed:", err.message);   

  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "invalid or empty JSON body" });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message });

};