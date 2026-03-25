const ROLES = {
  admin: {
    name: "Admin",
    permissions: ["read", "write", "delete", "export", "manage_users"]
  },
  contributor: {
    name: "Contributor", 
    permissions: ["read", "write", "export"]
  },
  readonly: {
    name: "Read Only",
    permissions: ["read"]
  }
};

const users = new Map();

users.set("tony", { 
  username: "tony", 
  role: "admin",
  name: "Tony Beal"
});

export function getUser(username) {
  return users.get(username);
}

export function getAllUsers() {
  return Array.from(users.values());
}

export function createUser(username, name, role = "readonly") {
  if (!ROLES[role]) {
    throw new Error(`Invalid role: ${role}`);
  }
  users.set(username, { username, name, role });
  return users.get(username);
}

export function updateUserRole(username, role) {
  if (!ROLES[role]) {
    throw new Error(`Invalid role: ${role}`);
  }
  const user = users.get(username);
  if (!user) {
    throw new Error(`User not found: ${username}`);
  }
  user.role = role;
  return user;
}

export function deleteUser(username) {
  if (username === "tony") {
    throw new Error("Cannot delete admin user");
  }
  return users.delete(username);
}

export function hasPermission(username, permission) {
  const user = users.get(username);
  if (!user) return false;
  const role = ROLES[user.role];
  return role?.permissions.includes(permission) || false;
}

export function getRoles() {
  return ROLES;
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const username = req.headers["x-user"] || "tony";
    if (!hasPermission(username, permission)) {
      return res.status(403).json({ error: "Permission denied" });
    }
    req.user = users.get(username);
    next();
  };
}
