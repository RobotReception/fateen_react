/** Query key factory for Roles & Permissions feature */
export const rolesKeys = {
    all: ["roles"] as const,
    list: () => [...rolesKeys.all, "list"] as const,
    permissions: (role: string) => [...rolesKeys.all, "permissions", role] as const,
    allPermissions: () => ["allPermissions"] as const,
    usersWithRole: (role: string) => [...rolesKeys.all, "users", role] as const,
    userRoles: (userId: string) => [...rolesKeys.all, "userRoles", userId] as const,
    myPermissions: () => [...rolesKeys.all, "myPermissions"] as const,
}
