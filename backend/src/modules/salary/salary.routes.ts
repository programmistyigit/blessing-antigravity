import { FastifyInstance } from 'fastify';
import { SalaryController } from './salary.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/permission.middleware';
import { Permission } from '../permissions/permission.enum';

export async function salaryRoutes(fastify: FastifyInstance) {
    // All routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    // Create salary (SALARY_MANAGE)
    fastify.post('/salaries', {
        preHandler: [requirePermission(Permission.SALARY_MANAGE)]
    }, SalaryController.createSalary);

    // Give advance (SALARY_ADVANCE_GIVE)
    fastify.post('/salaries/advance', {
        preHandler: [requirePermission(Permission.SALARY_ADVANCE_GIVE)]
    }, SalaryController.giveAdvance);

    // Give bonus (SALARY_BONUS_GIVE)
    fastify.post('/salaries/bonus', {
        preHandler: [requirePermission(Permission.SALARY_BONUS_GIVE)]
    }, SalaryController.giveBonus);

    // Get employee summary (SALARY_VIEW)
    fastify.get('/salaries/employees/:id/summary', {
        preHandler: [requirePermission(Permission.SALARY_VIEW)]
    }, SalaryController.getEmployeeSummary);

    // Get period summary (SALARY_VIEW)
    fastify.get('/salaries/periods/:id', {
        preHandler: [requirePermission(Permission.SALARY_VIEW)]
    }, SalaryController.getPeriodSummary);

    // Get salaries list (SALARY_VIEW)
    fastify.get('/salaries', {
        preHandler: [requirePermission(Permission.SALARY_VIEW)]
    }, SalaryController.getSalariesByPeriod);

    // Get advances list (SALARY_VIEW)
    fastify.get('/salaries/advances', {
        preHandler: [requirePermission(Permission.SALARY_VIEW)]
    }, SalaryController.getAdvancesByPeriod);

    // Get bonuses list (SALARY_VIEW)
    fastify.get('/salaries/bonuses', {
        preHandler: [requirePermission(Permission.SALARY_VIEW)]
    }, SalaryController.getBonusesByPeriod);
}
