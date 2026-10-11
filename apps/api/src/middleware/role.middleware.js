const VALID_ROLES = new Set([
  "DRIVER",
  "LINEHAUL_DRIVER",
  "CLERK",
  "SUPERVISOR",
]);

export function requireRoles(...allowedRoles) {
  if (
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => !VALID_ROLES.has(role))
  ) {
    throw new Error("requireRoles 必須指定有效的允許角色。");
  }

  const allowedRoleSet = new Set(allowedRoles);

  return function authorizeRole(req, res, next) {
    if (!req.user) {
      res.set("WWW-Authenticate", "Bearer");

      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "請先登入。",
        },
      });
    }

    if (!allowedRoleSet.has(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "你沒有執行此操作的權限。",
        },
      });
    }

    return next();
  };
}
