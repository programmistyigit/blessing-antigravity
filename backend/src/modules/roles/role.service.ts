import { Role } from './role.model';
import { Permission } from '../permissions/permission.enum';
import { emitRoleCreated, emitRoleUpdated } from '../../realtime/events';

export interface CreateRoleData {
    name: string;
    permissions: Permission[];
    canCreateUsers: boolean;
    canCreateRoles: boolean;
}

export interface UpdateRoleData {
    name?: string;
    permissions?: Permission[];
    canCreateUsers?: boolean;
    canCreateRoles?: boolean;
}

export class RoleService {
    /**
     * Create a new role
     */
    static async createRole(data: CreateRoleData): Promise<any> {
        // Check if role with same name already exists
        const existingRole = await Role.findOne({ name: data.name });

        if (existingRole) {
            throw new Error(`Role with name "${data.name}" already exists`);
        }

        // Create role
        const role = new Role(data);
        await role.save();

        // Emit real-time event
        emitRoleCreated({
            id: role._id.toString(),
            name: role.name,
            permissions: role.permissions,
            canCreateUsers: role.canCreateUsers,
            canCreateRoles: role.canCreateRoles,
        });

        return role;
    }

    /**
     * Update an existing role
     */
    static async updateRole(roleId: string, data: UpdateRoleData): Promise<any> {
        // Find role
        const role = await Role.findById(roleId);

        if (!role) {
            throw new Error('Role not found');
        }

        // Check for name conflict if name is being updated
        if (data.name && data.name !== role.name) {
            const existingRole = await Role.findOne({ name: data.name });

            if (existingRole) {
                throw new Error(`Role with name "${data.name}" already exists`);
            }
        }

        // Update fields
        if (data.name !== undefined) role.name = data.name;
        if (data.permissions !== undefined) role.permissions = data.permissions;
        if (data.canCreateUsers !== undefined) role.canCreateUsers = data.canCreateUsers;
        if (data.canCreateRoles !== undefined) role.canCreateRoles = data.canCreateRoles;

        await role.save();

        // Emit real-time event
        emitRoleUpdated({
            id: role._id.toString(),
            name: role.name,
            permissions: role.permissions,
            canCreateUsers: role.canCreateUsers,
            canCreateRoles: role.canCreateRoles,
        });

        return role;
    }

    /**
     * Get all roles
     */
    static async getAllRoles(): Promise<any[]> {
        return Role.find().sort({ createdAt: -1 });
    }

    /**
     * Get role by ID
     */
    static async getRoleById(roleId: string): Promise<any | null> {
        return Role.findById(roleId);
    }

    /**
     * Get role by name
     */
    static async getRoleByName(name: string): Promise<any | null> {
        return Role.findOne({ name });
    }
}
