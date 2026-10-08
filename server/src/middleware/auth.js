export function requireAdmin(req, res, next) {
  if (req.header('x-admin-key') && req.header('x-admin-key') === process.env.ADMIN_PASSWORD) return next();
  res.status(401).json({ error: 'Unauthorized' });
}
