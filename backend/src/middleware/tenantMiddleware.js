function tenantGuard(paramName = 'tenantId') {
  return (req, res, next) => {
    const { role, tenantId } = req.user;
    const requestedTenantId =
      req.params[paramName] || req.body[paramName];

    // Super admin can access any tenant
    if (role === 'super_admin') {
      return next();
    }

    // Tenant ID must match
    if (!requestedTenantId || requestedTenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: tenant access denied'
      });
    }

    next();
  };
}

module.exports = tenantGuard;
