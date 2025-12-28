import { FastifyInstance } from 'fastify';
import { AttendanceController } from './attendance.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function attendanceRoutes(fastify: FastifyInstance) {
    // Attendance
    fastify.post('/sections/:id/attendance', {
        preHandler: [authMiddleware, requirePermission(Permission.ATTENDANCE_CREATE)],
    }, AttendanceController.checkIn);

    fastify.patch('/attendance/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.ATTENDANCE_UPDATE)],
    }, AttendanceController.updateAttendance);

    fastify.get('/sections/:id/attendance', {
        preHandler: [authMiddleware, requirePermission(Permission.ATTENDANCE_READ)],
    }, AttendanceController.getAttendance);

    fastify.delete('/attendance/:id', {
        preHandler: [authMiddleware, requirePermission(Permission.ATTENDANCE_DELETE)],
    }, AttendanceController.deleteAttendance);

    fastify.post('/attendance/:id/approve', {
        preHandler: [authMiddleware, requirePermission(Permission.ATTENDANCE_APPROVE)],
    }, AttendanceController.approveAttendance);

    // GPS
    fastify.post('/sections/:id/gps', {
        preHandler: [authMiddleware, requirePermission(Permission.GPS_MONITOR_UPDATE)],
    }, AttendanceController.logGPS);

    fastify.get('/sections/:id/gps', {
        preHandler: [authMiddleware, requirePermission(Permission.GPS_MONITOR_READ)],
    }, AttendanceController.getGPSHistory);
}
