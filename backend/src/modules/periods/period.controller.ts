import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PeriodService } from './period.service';
import { PeriodExpenseService } from './period-expense.service';
import { ExpenseCategory } from './period-expense.model';
import { createPeriodSchema, updatePeriodSchema } from './period.schema';
import { SectionPLService } from '../sections/section-pl.service';

/**
 * Period Controller
 * CRUD endpoints for Period management
 */
export class PeriodController {
    /**
     * Centralized error handler for proper HTTP status codes
     */
    private static handleError(error: unknown, reply: FastifyReply) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }
        if (error instanceof Error) {
            // 404 - Not Found
            if (error.message.includes('not found') || error.message.includes('topilmadi')) {
                return reply.status(404).send({
                    success: false,
                    error: error.message,
                });
            }
            // 409 - Conflict (already exists, already closed)
            if (error.message.includes('already') || error.message.includes('mavjud')) {
                return reply.status(409).send({
                    success: false,
                    error: error.message,
                });
            }
            // 403 - Forbidden (permission, cannot close)
            if (error.message.includes('Cannot') || error.message.includes('bo\'lmaydi')) {
                return reply.status(403).send({
                    success: false,
                    error: error.message,
                });
            }
            // Default to 400 for business logic errors
            return reply.status(400).send({
                success: false,
                error: error.message,
            });
        }
        console.error('Unhandled error:', error);
        return reply.status(500).send({
            success: false,
            error: 'Internal server error',
        });
    }

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
        } catch (error) {
            return PeriodController.handleError(error, reply);
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
            const user = request.user as any;

            const period = await PeriodService.closePeriod(id, user.userId);

            return reply.status(200).send({
                success: true,
                data: period,
            });
        } catch (error) {
            return PeriodController.handleError(error, reply);
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
        } catch (error) {
            return PeriodController.handleError(error, reply);
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
        } catch (error) {
            return PeriodController.handleError(error, reply);
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
        } catch (error) {
            return PeriodController.handleError(error, reply);
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
        } catch (error) {
            return PeriodController.handleError(error, reply);
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
        } catch (error) {
            return PeriodController.handleError(error, reply);
        }
    }

    /**
     * GET /api/periods/:id/sections/pl
     * Get P&L for all sections in a period
     */
    static async getAllSectionsPL(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            const sectionsPL = await SectionPLService.getAllSectionsPLForPeriod(id);

            return reply.status(200).send({
                success: true,
                data: sectionsPL,
            });
        } catch (error) {
            return PeriodController.handleError(error, reply);
        }
    }
}
