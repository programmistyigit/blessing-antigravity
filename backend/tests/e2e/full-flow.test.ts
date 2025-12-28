import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/core/server';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';
import mongoose from 'mongoose';

// Routes
import { authRoutes } from '../../src/modules/auth/auth.routes';
import { roleRoutes } from '../../src/modules/roles/role.routes';
import { userRoutes } from '../../src/modules/users/user.routes';
import { delegationRoutes } from '../../src/modules/users/delegation.routes';
import { sectionRoutes } from '../../src/modules/sections/section.routes';
import { batchRoutes } from '../../src/modules/sections/batch.routes';
import { inventoryRoutes } from '../../src/modules/inventory/inventory.routes';
import { healthRoutes } from '../../src/modules/health/health.routes';
import { attendanceRoutes } from '../../src/modules/attendance/attendance.routes';
import { reportRoutes } from '../../src/modules/reports/report.routes';
import { dashboardRoutes } from '../../src/modules/dashboard/dashboard.routes';
import { languageHook } from '../../src/middlewares/language.middleware';

describe('Full Backend E2E Flow', () => {
    let app: FastifyInstance;
    let request: any;

    // Tokens
    let directorToken: string;
    let managerToken: string;
    let workerToken: string;

    // IDs
    let managerRoleId: string;
    let workerRoleId: string;
    let managerUserId: string;
    let workerUserId: string;
    let delegationId: string;
    let testSectionId: string;

    // Usernames
    let managerUsername: string;
    let workerUsername: string;

    beforeAll(async () => {
        // 1. Connect DB
        await connectDatabase();
        // 2. Init DB (Create Director if needed)
        await initializeDatabase();

        // 3. Create App
        app = await createServer();
        app.addHook('onRequest', languageHook);

        // 4. Register Routes
        await app.register(authRoutes, { prefix: '/api/auth' });
        await app.register(roleRoutes, { prefix: '/api/roles' });
        await app.register(userRoutes, { prefix: '/api/users' });
        await app.register(delegationRoutes, { prefix: '/api' });
        await app.register(sectionRoutes, { prefix: '/api' });
        await app.register(batchRoutes, { prefix: '/api' });
        await app.register(inventoryRoutes, { prefix: '/api' });
        await app.register(healthRoutes, { prefix: '/api' });
        await app.register(attendanceRoutes, { prefix: '/api' });
        await app.register(reportRoutes, { prefix: '/api' });
        await app.register(dashboardRoutes, { prefix: '/api' });

        await app.ready();
        request = supertest(app.server);
    });

    afterAll(async () => {
        await app.close();
        await disconnectDatabase();
    });

    it('Step 1: Health / Server Check', async () => {
        // Just checking if we can get a 404 on root or something to prove server is up
        const res = await request.get('/api/auth/health-check-fake');
        expect(res.status).not.toBe(500);
    });

    it('Step 2: Director Login', async () => {
        const res = await request.post('/api/auth/login')
            .send({
                username: 'director',
                password: 'director123'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();

        directorToken = res.body.data.token;
    });

    it('Step 3: Create Roles (Manager & Worker)', async () => {
        // Create Manager Role with SECTION_STATUS_UPDATE
        const managerRes = await request.post('/api/roles')
            .set('Authorization', `Bearer ${directorToken}`)
            .send({
                name: 'E2E_MANAGER_' + Date.now(),
                permissions: ['SECTION_STATUS_UPDATE'],
                canCreateUsers: false,
                canCreateRoles: false
            });

        // It might fail if name collision, but we append timestamp
        if (managerRes.status !== 201) console.error('Manager role create failed:', managerRes.body);
        expect(managerRes.status).toBe(201);
        managerRoleId = managerRes.body.data._id;

        // Create Worker Role with ATTENDANCE_CREATE
        const workerRes = await request.post('/api/roles')
            .set('Authorization', `Bearer ${directorToken}`)
            .send({
                name: 'E2E_WORKER_' + Date.now(),
                permissions: ['ATTENDANCE_CREATE'],
                canCreateUsers: false,
                canCreateRoles: false
            });

        expect(workerRes.status).toBe(201);
        workerRoleId = workerRes.body.data._id;
    });

    it('Step 4: Create Users (Manager & Worker)', async () => {
        // Create Manager User
        managerUsername = 'manager_' + Date.now();
        const managerRes = await request.post('/api/users')
            .set('Authorization', `Bearer ${directorToken}`)
            .send({
                fullName: 'Manager User',
                username: managerUsername,
                password: 'password123',
                roleId: managerRoleId
            });

        expect(managerRes.status).toBe(201);
        managerUserId = managerRes.body.data._id;

        // Create Worker User
        workerUsername = 'worker_' + Date.now();
        const workerRes = await request.post('/api/users')
            .set('Authorization', `Bearer ${directorToken}`)
            .send({
                fullName: 'Worker User',
                username: workerUsername,
                password: 'password123',
                roleId: workerRoleId
            });

        expect(workerRes.status).toBe(201);
        workerUserId = workerRes.body.data._id;
    });

    it('Step 5: Manager Login', async () => {
        const loginRes = await request.post('/api/auth/login')
            .send({
                username: managerUsername,
                password: 'password123'
            });

        expect(loginRes.status).toBe(200);
        managerToken = loginRes.body.data.token;
    });

    it('Step 6: Worker Login', async () => {
        const loginRes = await request.post('/api/auth/login')
            .send({
                username: workerUsername,
                password: 'password123'
            });

        expect(loginRes.status).toBe(200);
        workerToken = loginRes.body.data.token;
    });

    it('Step 7: Baseline Permission Test (Worker Denied)', async () => {
        // Worker tries to update section status (SECTION_STATUS_UPDATE)
        // Need a section first. Director creates one.

        const sectionRes = await request.post('/api/sections')
            .set('Authorization', `Bearer ${directorToken}`)
            .send({
                name: 'E2E Section ' + Date.now(),
                capacity: 1000,
                recommendedWorkers: 5
            });
        expect(sectionRes.status).toBe(201);
        testSectionId = sectionRes.body.data._id;

        // Worker tries status update
        const failRes = await request.patch(`/api/sections/${testSectionId}/status`)
            .set('Authorization', `Bearer ${workerToken}`)
            .send({ status: 'ACTIVE' });

        // Should be 403 Forbidden
        expect(failRes.status).toBe(403);
    });

    it('Step 8: Director Creates Delegation', async () => {
        const res = await request.post('/api/delegations')
            .set('Authorization', `Bearer ${directorToken}`)
            .send({
                toUserId: workerUserId,
                permissions: ['SECTION_STATUS_UPDATE']
            });

        expect(res.status).toBe(201);
        expect(res.body.data.isActive).toBe(true);
        delegationId = res.body.data._id;
    });

    it('Step 9: Delegation Test (Worker Granted)', async () => {
        const res = await request.patch(`/api/sections/${testSectionId}/status`)
            .set('Authorization', `Bearer ${workerToken}`)
            .send({ status: 'ACTIVE' });

        // Should now be 200 OK
        if (res.status !== 200) console.error('Delegation access failed:', res.body);
        expect(res.status).toBe(200);
    });

    it('Step 10: Deactivate Delegation', async () => {
        const res = await request.patch(`/api/delegations/${delegationId}/deactivate`)
            .set('Authorization', `Bearer ${directorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.isActive).toBe(false);
    });

    it('Step 11: Worker Denied Again', async () => {
        const res = await request.patch(`/api/sections/${testSectionId}/status`)
            .set('Authorization', `Bearer ${workerToken}`)
            .send({ status: 'CLEANING' }); // Try another status change

        expect(res.status).toBe(403);
    });

    it('Step 12: Router Coverage', async () => {
        // /api/users
        const usersRes = await request.get('/api/users')
            .set('Authorization', `Bearer ${directorToken}`);
        expect(usersRes.status).toBe(200);

        // /api/delegations
        const delRes = await request.get('/api/delegations')
            .set('Authorization', `Bearer ${directorToken}`);
        expect(delRes.status).toBe(200);

        // /api/batches (permissions required, director has it)
        const batchRes = await request.get(`/api/sections/${testSectionId}/batches`)
            .set('Authorization', `Bearer ${directorToken}`);
        expect(batchRes.status).toBe(200);
    });
});
