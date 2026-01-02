export const PLAN_LIMITS = {
    free: { max_users: 5, max_projects: 3 },
    pro: { max_users: 25, max_projects: 15 },
    enterprise: { max_users: 100, max_projects: 50 }
};

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    TENANT_ADMIN: 'tenant_admin',
    USER: 'user'
};