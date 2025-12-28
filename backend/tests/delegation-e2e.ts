/**
 * Delegation E2E Test Script
 * Tests the full delegation workflow using DELEGATE_PERMISSIONS permission
 */

const BASE_URL = 'http://localhost:3000/api';

async function request(method: string, path: string, body?: any, token?: string) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    return { status: res.status, data };
}

async function runE2ETest() {
    console.log('═══════════════════════════════════════════════');
    console.log('  DELEGATION END-TO-END TEST');
    console.log('═══════════════════════════════════════════════\n');

    // ==========================================
    // STEP 1: Director Login
    // ==========================================
    console.log('📍 STEP 1: Director Login');
    const loginRes = await request('POST', '/auth/login', {
        username: 'director',
        password: 'director123',
    });

    if (!loginRes.data.success) {
        console.error('❌ Director login failed:', loginRes.data);
        process.exit(1);
    }

    const directorToken = loginRes.data.data.token;
    const directorPermissions = loginRes.data.data.user.role.permissions;
    console.log('✅ Director logged in');
    console.log(`   Permissions: ${directorPermissions.join(', ')}`);

    if (!directorPermissions.includes('SYSTEM_ALL')) {
        console.error('❌ Director should have SYSTEM_ALL permission!');
        process.exit(1);
    }
    console.log('✅ Director has SYSTEM_ALL permission\n');

    // ==========================================
    // STEP 2: Create WORKER Role
    // ==========================================
    console.log('📍 STEP 2: Create WORKER Role');

    const workerRoleRes = await request('POST', '/roles', {
        name: 'E2E_WORKER',
        permissions: ['ATTENDANCE_CREATE'],
        canCreateUsers: false,
        canCreateRoles: false,
    }, directorToken);

    let workerRoleId: string;
    if (!workerRoleRes.data.success) {
        console.log('⚠️ Role may already exist, fetching roles...');
        const rolesRes = await request('GET', '/roles', null, directorToken);
        const roles = rolesRes.data.data || [];
        const existingRole = roles.find((r: any) => r.name === 'E2E_WORKER');
        if (existingRole) {
            workerRoleId = existingRole._id;
            console.log(`   Using existing role: E2E_WORKER (${workerRoleId})`);
        } else {
            console.error('❌ Cannot create or find E2E_WORKER role');
            process.exit(1);
        }
    } else {
        workerRoleId = workerRoleRes.data.data._id;
        console.log(`✅ Created E2E_WORKER role: ${workerRoleId}`);
    }
    console.log('');

    // ==========================================
    // STEP 3: Create Worker User
    // ==========================================
    console.log('📍 STEP 3: Create Worker User');

    const workerUserRes = await request('POST', '/users', {
        fullName: 'E2E Test Worker',
        username: 'e2eworker',
        password: 'worker123',
        roleId: workerRoleId,
    }, directorToken);

    let workerId: string;
    if (!workerUserRes.data.success) {
        console.log('⚠️ User may already exist, fetching users...');
        const usersRes = await request('GET', '/users', null, directorToken);
        const users = usersRes.data.data || [];
        const existingUser = users.find((u: any) => u.username === 'e2eworker');
        if (existingUser) {
            workerId = existingUser._id;
            console.log(`   Using existing user: e2eworker (${workerId})`);
        } else {
            console.error('❌ Cannot create or find e2eworker');
            process.exit(1);
        }
    } else {
        workerId = workerUserRes.data.data._id;
        console.log(`✅ Created worker user: e2eworker / worker123 (${workerId})`);
    }
    console.log('');

    // ==========================================
    // STEP 4: Baseline Test - Worker CANNOT access delegation
    // ==========================================
    console.log('📍 STEP 4: Baseline Test (Worker should be denied)');

    const workerLoginRes = await request('POST', '/auth/login', {
        username: 'e2eworker',
        password: 'worker123',
    });

    if (!workerLoginRes.data.success) {
        console.error('❌ Worker login failed:', workerLoginRes.data);
        process.exit(1);
    }

    const workerToken = workerLoginRes.data.data.token;
    console.log('✅ Worker logged in');
    console.log(`   Worker permissions: ${workerLoginRes.data.data.user.role.permissions.join(', ')}`);

    // Try to create a delegation (requires DELEGATE_PERMISSIONS)
    const baselineRes = await request('POST', '/delegations', {
        toUserId: workerId,
        permissions: ['SECTION_VIEW'],
    }, workerToken);

    console.log(`   Worker POST /delegations: Status ${baselineRes.status}`);

    if (baselineRes.status === 403) {
        console.log('✅ BASELINE PASSED: Worker correctly denied (403)\n');
    } else {
        console.log(`❌ BASELINE FAILED: Worker should be denied but got ${baselineRes.status}`);
        console.log(`   Response: ${JSON.stringify(baselineRes.data)}\n`);
        process.exit(1);
    }

    // ==========================================
    // STEP 5: Director creates delegation for Worker
    // ==========================================
    console.log('📍 STEP 5: Director creates delegation for Worker');

    const createDelegationRes = await request('POST', '/delegations', {
        toUserId: workerId,
        permissions: ['DELEGATE_PERMISSIONS'],
    }, directorToken);

    if (!createDelegationRes.data.success) {
        console.error('❌ Delegation creation failed:', createDelegationRes.data);
        process.exit(1);
    }

    const delegationId = createDelegationRes.data.data._id;
    const isActive = createDelegationRes.data.data.isActive;
    console.log(`✅ Delegation created: ${delegationId}`);
    console.log(`   isActive: ${isActive}`);
    console.log(`   permissions: DELEGATE_PERMISSIONS\n`);

    // ==========================================
    // STEP 6: Worker CAN now access delegation
    // ==========================================
    console.log('📍 STEP 6: Worker tests WITH delegation');

    const delegatedRes = await request('POST', '/delegations', {
        toUserId: workerId,
        permissions: ['SECTION_VIEW'],
    }, workerToken);

    console.log(`   Worker POST /delegations with delegation: Status ${delegatedRes.status}`);

    if (delegatedRes.status === 201 || delegatedRes.status === 200 || delegatedRes.status === 400) {
        // 400 might be validation error but permission passed
        console.log('✅ DELEGATION TEST PASSED: Worker can now access via delegation');
        if (delegatedRes.status === 400) {
            console.log(`   (Validation error: ${delegatedRes.data.error})\n`);
        } else {
            console.log('');
        }
    } else if (delegatedRes.status === 403) {
        console.log('❌ DELEGATION TEST FAILED: Worker still denied despite delegation');
        console.log(`   Response: ${JSON.stringify(delegatedRes.data)}\n`);
        process.exit(1);
    }

    // ==========================================
    // STEP 7: Director deactivates delegation
    // ==========================================
    console.log('📍 STEP 7: Director deactivates delegation');

    const deactivateRes = await request('PATCH', `/delegations/${delegationId}/deactivate`, {}, directorToken);

    if (!deactivateRes.data.success) {
        console.error('❌ Deactivation failed:', deactivateRes.data);
        process.exit(1);
    }

    console.log('✅ Delegation deactivated');
    console.log(`   isActive: ${deactivateRes.data.data.isActive}\n`);

    // ==========================================
    // STEP 8: Worker CANNOT access after deactivation
    // ==========================================
    console.log('📍 STEP 8: Worker tests AFTER deactivation');

    const postDeactivationRes = await request('POST', '/delegations', {
        toUserId: workerId,
        permissions: ['SECTION_VIEW'],
    }, workerToken);

    console.log(`   Worker POST /delegations after deactivation: Status ${postDeactivationRes.status}`);

    if (postDeactivationRes.status === 403) {
        console.log('✅ DEACTIVATION TEST PASSED: Worker correctly denied again (403)\n');
    } else {
        console.log(`❌ DEACTIVATION TEST FAILED: Should be 403 but got ${postDeactivationRes.status}`);
        console.log(`   Response: ${JSON.stringify(postDeactivationRes.data)}\n`);
        process.exit(1);
    }

    // ==========================================
    // FINAL RESULTS
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('  ✅ DELEGATION END-TO-END TEST PASSED');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('Summary:');
    console.log('  ✓ Director login with SYSTEM_ALL');
    console.log('  ✓ Created E2E_WORKER role & user');
    console.log('  ✓ Baseline: Worker denied (403)');
    console.log('  ✓ Delegation: Worker granted access');
    console.log('  ✓ Deactivation: Worker denied again (403)');
    console.log('');
    console.log('Files that enable delegation:');
    console.log('  - permission.middleware.ts (checks active delegations)');
    console.log('  - delegation.service.ts (getDelegatedPermissions)');
    console.log('  - delegation.model.ts (isActive flag)');
}

runE2ETest().catch(console.error);
