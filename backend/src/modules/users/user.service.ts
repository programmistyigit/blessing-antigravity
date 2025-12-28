import { User, IUser } from './user.model';
import { Role } from '../roles/role.model';
import { AuthService } from '../auth/auth.service';
import { emitUserCreated, emitUserUpdated } from '../../realtime/events';

export interface CreateUserData {
    fullName: string;
    username: string;
    password: string;
    roleId: string;
    isActive?: boolean;
}

export interface UpdateUserData {
    fullName?: string;
    username?: string;
    password?: string;
    roleId?: string;
    isActive?: boolean;
}

export class UserService {
    /**
     * Create a new user
     */
    static async createUser(data: CreateUserData): Promise<IUser> {
        // Check if username already exists
        const existingUser = await User.findOne({ username: data.username });

        if (existingUser) {
            throw new Error(`User with username "${data.username}" already exists`);
        }

        // Verify role exists
        const role = await Role.findById(data.roleId);

        if (!role) {
            throw new Error('Invalid role ID');
        }

        // Hash password
        const passwordHash = await AuthService.hashPassword(data.password);

        // Create user
        const user = new User({
            fullName: data.fullName,
            username: data.username,
            passwordHash,
            role: data.roleId,
            isActive: data.isActive !== undefined ? data.isActive : true,
        });

        await user.save();

        // Populate role before returning
        await user.populate('role');

        // Emit real-time event
        emitUserCreated({
            id: user._id.toString(),
            fullName: user.fullName,
            username: user.username,
            role: {
                id: role._id.toString(),
                name: role.name,
            },
            isActive: user.isActive,
        });

        return user;
    }

    /**
     * Update an existing user
     */
    static async updateUser(userId: string, data: UpdateUserData): Promise<IUser> {
        // Find user
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Check for username conflict if username is being updated
        if (data.username && data.username !== user.username) {
            const existingUser = await User.findOne({ username: data.username });

            if (existingUser) {
                throw new Error(`User with username "${data.username}" already exists`);
            }
        }

        // Verify role exists if being updated
        if (data.roleId) {
            const role = await Role.findById(data.roleId);

            if (!role) {
                throw new Error('Invalid role ID');
            }
        }

        // Update fields
        if (data.fullName !== undefined) user.fullName = data.fullName;
        if (data.username !== undefined) user.username = data.username;
        if (data.roleId !== undefined) user.role = data.roleId as any;
        if (data.isActive !== undefined) user.isActive = data.isActive;

        // Update password if provided
        if (data.password) {
            user.passwordHash = await AuthService.hashPassword(data.password);
        }

        await user.save();

        // Populate role before returning
        await user.populate('role');

        // Emit real-time event
        const populatedRole = await Role.findById(user.role);

        emitUserUpdated({
            id: user._id.toString(),
            fullName: user.fullName,
            username: user.username,
            role: populatedRole ? {
                id: populatedRole._id.toString(),
                name: populatedRole.name,
            } : null,
            isActive: user.isActive,
        });

        return user;
    }

    /**
     * Get all users
     */
    static async getAllUsers(): Promise<IUser[]> {
        return User.find()
            .populate('role')
            .sort({ createdAt: -1 });
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<IUser | null> {
        return User.findById(userId).populate('role');
    }

    /**
     * Get user by username
     */
    static async getUserByUsername(username: string): Promise<IUser | null> {
        return User.findOne({ username }).populate('role');
    }
}
