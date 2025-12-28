import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../users/user.model';
import { Role } from '../roles/role.model';
import { Permission } from '../permissions/permission.enum';
import config from '../../core/config';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface TokenPayload {
    userId: string;
    roleId: string;
    permissions: Permission[];
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        username: string;
        fullName: string;
        role: {
            id: string;
            name: string;
            permissions: Permission[];
        };
    };
}

export class AuthService {
    /**
     * Hash a plain text password
     */
    static async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    /**
     * Verify password against hash
     */
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate JWT token with user data and permissions
     */
    static generateToken(payload: TokenPayload): string {
        return jwt.sign({ ...payload }, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        } as jwt.SignOptions);
    }

    /**
     * Verify and decode JWT token
     */
    static verifyToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, config.jwt.secret) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Authenticate user and return token
     */
    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { username, password } = credentials;

        // Find user with password hash (explicitly selected)
        const user = await User.findOne({ username })
            .select('+passwordHash')
            .populate('role');

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error('User account is deactivated');
        }

        // Verify password
        const isPasswordValid = await this.verifyPassword(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Get role with permissions
        const role = await Role.findById(user.role);

        if (!role) {
            throw new Error('User role not found');
        }

        // Generate token with user data and permissions
        const tokenPayload: TokenPayload = {
            userId: user._id.toString(),
            roleId: role._id.toString(),
            permissions: role.permissions,
        };

        const token = this.generateToken(tokenPayload);

        // Return authentication response
        return {
            token,
            user: {
                id: user._id.toString(),
                username: user.username,
                fullName: user.fullName,
                role: {
                    id: role._id.toString(),
                    name: role.name,
                    permissions: role.permissions,
                },
            },
        };
    }
}
