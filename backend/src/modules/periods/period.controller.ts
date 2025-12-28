import { FastifyRequest, FastifyReply } from 'fastify';
import { PeriodService } from './period.service';
import { PeriodExpenseService } from './period-expense.service';
import { ExpenseCategory } from './period-expense.model';
import { createPeriodSchema, updatePeriodSchema } from './period.schema';

/**
 * Period Controller
 * CRUD endpoints for Period management
 */
export class PeriodController {
    /**
     * POST /api/periods
     * Create a new period
     */
    static async createPeriod(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            const parsed = createPeriodSchema.parse(request.body);
            const user = (request as any).user;

            const period = await PeriodService.createPeriod({
                name: parsed.name,
                startDate: new Date(parsed.startDate),
                sections: parsed.sections,
                notes: parsed.notes,
                createdBy: user.userId,
            });

            return reply.status(201).send({
                success: true,
                data: period,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to create period',
            });
        }
    }

    /**
     * POST /api/periods/:id/close
     * Close a period
     */
    static async closePeriod(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            const period = await PeriodService.closePeriod(id);

            return reply.status(200).send({
                success: true,
                data: period,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to close period',
            });
        }
    }

    /**
     * GET /api/periods
     * Get all periods
     */
    static async getAllPeriods(
        _request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            const periods = await PeriodService.getAllPeriods();

            return reply.status(200).send({
                success: true,
                data: periods,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to get periods',
            });
        }
    }

    /**
     * GET /api/periods/:id
     * Get period by ID
     */
    static async getPeriod(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            const period = await PeriodService.getPeriodById(id);

            if (!period) {
                return reply.status(404).send({
                    success: false,
                    error: 'Period not found',
                });
            }

            return reply.status(200).send({
                success: true,
                data: period,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to get period',
            });
        }
    }

    /**
     * PATCH /api/periods/:id
     * Update an ACTIVE period
     */
    static async updatePeriod(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const parsed = updatePeriodSchema.parse(request.body);

            const period = await PeriodService.updatePeriod(id, parsed);

            return reply.status(200).send({
                success: true,
                data: period,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to update period',
            });
        }
    }

    /**
     * POST /api/periods/:id/expenses
     * Add expense to a period
     */
    static async addExpense(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const user = (request as any).user;
            const body = request.body as any;

            const expense = await PeriodExpenseService.addExpense({
                periodId: id,
                category: body.category as ExpenseCategory,
                amount: body.amount,
                description: body.description,
                expenseDate: new Date(body.expenseDate),
                createdBy: user.userId,
            });

            return reply.status(201).send({
                success: true,
                data: expense,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to add expense',
            });
        }
    }

    /**
     * GET /api/periods/:id/expenses
     * Get all expenses for a period
     */
    static async getExpenses(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            const expenses = await PeriodExpenseService.getExpensesByPeriod(id);

            return reply.status(200).send({
                success: true,
                data: expenses,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message || 'Failed to get expenses',
            });
        }
    }
}
