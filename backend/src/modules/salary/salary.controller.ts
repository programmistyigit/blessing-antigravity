import { FastifyRequest, FastifyReply } from 'fastify';
import { SalaryService } from './salary.service';

export class SalaryController {
    /**
     * Create base salary for employee
     */
    static async createSalary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { employeeId, baseSalary, periodId, sectionId } = request.body as any;

            if (!employeeId || !baseSalary || !periodId) {
                return reply.status(400).send({
                    error: 'employeeId, baseSalary, and periodId are required'
                });
            }

            if (baseSalary <= 0) {
                return reply.status(400).send({
                    error: 'baseSalary must be a positive number'
                });
            }

            const salary = await SalaryService.createSalary({
                employeeId,
                baseSalary,
                periodId,
                sectionId
            });

            return reply.status(201).send(salary);
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Give advance to employee
     */
    static async giveAdvance(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { employeeId, amount, periodId, sectionId, description } = request.body as any;
            const userId = (request as any).user?.id;

            if (!employeeId || !amount || !periodId) {
                return reply.status(400).send({
                    error: 'employeeId, amount, and periodId are required'
                });
            }

            if (amount <= 0) {
                return reply.status(400).send({
                    error: 'amount must be a positive number'
                });
            }

            const advance = await SalaryService.giveAdvance({
                employeeId,
                amount,
                periodId,
                sectionId,
                description,
                givenBy: userId
            });

            return reply.status(201).send(advance);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Give bonus to employee
     */
    static async giveBonus(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { employeeId, amount, reason, periodId, sectionId } = request.body as any;
            const userId = (request as any).user?.id;

            if (!employeeId || !amount || !reason || !periodId) {
                return reply.status(400).send({
                    error: 'employeeId, amount, reason, and periodId are required'
                });
            }

            if (amount <= 0) {
                return reply.status(400).send({
                    error: 'amount must be a positive number'
                });
            }

            const bonus = await SalaryService.giveBonus({
                employeeId,
                amount,
                reason,
                periodId,
                sectionId,
                givenBy: userId
            });

            return reply.status(201).send(bonus);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get employee salary summary
     */
    static async getEmployeeSummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const { periodId } = request.query as { periodId?: string };

            const summary = await SalaryService.getEmployeeSummary(id, periodId);
            return reply.send(summary);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get period salary summary
     */
    static async getPeriodSummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const summary = await SalaryService.getPeriodSummary(id);
            return reply.send(summary);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get all salaries for a period
     */
    static async getSalariesByPeriod(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { periodId } = request.query as { periodId: string };

            if (!periodId) {
                return reply.status(400).send({ error: 'periodId query param is required' });
            }

            const salaries = await SalaryService.getSalariesByPeriod(periodId);
            return reply.send(salaries);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get advances for a period
     */
    static async getAdvancesByPeriod(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { periodId } = request.query as { periodId: string };

            if (!periodId) {
                return reply.status(400).send({ error: 'periodId query param is required' });
            }

            const advances = await SalaryService.getAdvancesByPeriod(periodId);
            return reply.send(advances);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    /**
     * Get bonuses for a period
     */
    static async getBonusesByPeriod(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { periodId } = request.query as { periodId: string };

            if (!periodId) {
                return reply.status(400).send({ error: 'periodId query param is required' });
            }

            const bonuses = await SalaryService.getBonusesByPeriod(periodId);
            return reply.send(bonuses);
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }
}
