import { User } from '../modules/users/user.model';
import { Role } from '../modules/roles/role.model';
import { Permission } from '../modules/permissions/permission.enum';
import { AuthService } from '../modules/auth/auth.service';

/**
 * Initialize database with default DIRECTOR role and user
 * Only runs if no users exist in the database
 */
export async function initializeDatabase(): Promise<void> {
    try {
        // Check if any users exist
        const userCount = await User.countDocuments();

        if (userCount > 0) {
            console.log('✅ Database already initialized');
            return;
        }

        console.log('🚀 Initializing database with default data...');

        // Create DIRECTOR role with SYSTEM_ALL permission
        const directorRole = new Role({
            name: 'DIRECTOR',
            permissions: [Permission.SYSTEM_ALL],
            canCreateUsers: true,
            canCreateRoles: true,
        });

        await directorRole.save();
        console.log('✅ Created DIRECTOR role with SYSTEM_ALL permission');

        // Create director user
        const passwordHash = await AuthService.hashPassword('director123');

        const directorUser = new User({
            fullName: 'System Director',
            username: 'director',
            passwordHash,
            role: directorRole._id,
            isActive: true,
        });

        await directorUser.save();
        console.log('✅ Created default director user');

        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log('  DEFAULT LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════════════');
        console.log('  Username: director');
        console.log('  Password: director123');
        console.log('═══════════════════════════════════════════════');
        console.log('  ⚠️  CHANGE PASSWORD IN PRODUCTION!');
        console.log('═══════════════════════════════════════════════');
        console.log('');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}
