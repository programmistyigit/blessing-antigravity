import { Delegation, IDelegation } from './delegation.model';
import { User } from './user.model';
import { Permission } from '../permissions/permission.enum';
import { emitDelegationActivated, emitDelegationDeactivated } from '../../realtime/events';
import { Types } from 'mongoose';

interface CreateDelegationData {
    fromUserId: string;
    toUserId: string;
    permissions: Permission[];
    sections?: string[];
}

export class DelegationService {
    /**
     * Create a new delegation
     */
    static async createDelegation(data: CreateDelegationData): Promise<IDelegation> {
        // Validate target user exists
        const targetUser = await User.findById(data.toUserId);
        if (!targetUser) {
            throw new Error('Target user not found');
        }

        // Cannot delegate to yourself
        if (data.fromUserId === data.toUserId) {
            throw new Error('Cannot delegate permissions to yourself');
        }

        // Check for existing active delegation from same user to same user
        const existingDelegation = await Delegation.findOne({
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            isActive: true,
        });

        if (existingDelegation) {
            throw new Error('Active delegation already exists for this user pair');
        }

        const delegation = new Delegation({
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            permissions: data.permissions,
            sections: data.sections?.map(id => new Types.ObjectId(id)),
            isActive: true,
        });

        await delegation.save();

        // Emit event
        emitDelegationActivated(delegation);

        return delegation;
    }

    /**
     * Activate a delegation
     */
    static async activateDelegation(delegationId: string, userId: string): Promise<IDelegation> {
        const delegation = await Delegation.findById(delegationId);
        if (!delegation) {
            throw new Error('Delegation not found');
        }

        // Only the original delegator can activate
        if (delegation.fromUserId.toString() !== userId) {
            throw new Error('Only the delegator can activate this delegation');
        }

        if (delegation.isActive) {
            throw new Error('Delegation is already active');
        }

        delegation.isActive = true;
        await delegation.save();

        emitDelegationActivated(delegation);

        return delegation;
    }

    /**
     * Deactivate a delegation
     */
    static async deactivateDelegation(delegationId: string, userId: string): Promise<IDelegation> {
        const delegation = await Delegation.findById(delegationId);
        if (!delegation) {
            throw new Error('Delegation not found');
        }

        // Only the original delegator can deactivate
        if (delegation.fromUserId.toString() !== userId) {
            throw new Error('Only the delegator can deactivate this delegation');
        }

        if (!delegation.isActive) {
            throw new Error('Delegation is already inactive');
        }

        delegation.isActive = false;
        await delegation.save();

        emitDelegationDeactivated(delegation);

        return delegation;
    }

    /**
     * Get all delegations for a user (as delegator)
     */
    static async getDelegationsFromUser(userId: string): Promise<IDelegation[]> {
        return Delegation.find({ fromUserId: userId })
            .populate('toUserId', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Get all active delegations TO a user
     */
    static async getActiveDelegationsToUser(userId: string): Promise<IDelegation[]> {
        return Delegation.find({ toUserId: userId, isActive: true })
            .populate('fromUserId', 'fullName username');
    }

    /**
     * Get delegated permissions for a user
     * Used in permission middleware to augment user permissions
     */
    static async getDelegatedPermissions(userId: string, sectionId?: string): Promise<Permission[]> {
        const delegations = await Delegation.find({ toUserId: userId, isActive: true });

        const permissions: Permission[] = [];

        for (const delegation of delegations) {
            // If sections are specified, only include if sectionId matches
            if (delegation.sections && delegation.sections.length > 0 && sectionId) {
                const hasSection = delegation.sections.some(
                    s => s.toString() === sectionId
                );
                if (!hasSection) continue;
            }

            permissions.push(...(delegation.permissions as Permission[]));
        }

        // Return unique permissions
        return [...new Set(permissions)];
    }
}
