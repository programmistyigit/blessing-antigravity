import { FastifyRequest, FastifyReply } from 'fastify';
import { RepairExpenseService } from './repair-expense.service';

interface RequestUser {
    userId: string;
    roleId: string;
    permissions: string[];
}

/**
 * Repair Expense Controller
 * Incident asosida xarajat yozish API
 */
export class RepairExpenseController {
    /**
     * POST /api/incidents/:id/expense
     * Create repair expense for an incident
     */
    static async createRepairExpense(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user as RequestUser;
            const { id } = request.params as { id: string };
            const body = request.body as any;

            // Validate required fields
            if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
                return reply.code(400).send({ success: false, error: 'amount must be a positive number' });
            }
            if (!body.description || typeof body.description !== 'string') {
                return reply.code(400).send({ success: false, error: 'description is required' });
            }
            if (body.description.trim().length < 5) {
                return reply.code(400).send({ success: false, error: 'description must be at least 5 characters' });
            }

            const result = await RepairExpenseService.createRepairExpense({
                incidentId: id,
                amount: body.amount,
                description: body.description,
                periodId: body.periodId,
                createdBy: user.userId,
            });

            return reply.code(201).send({
                success: true,
                data: {
                    expense: result.expense,
                    incident: result.incident,
                },
                message: 'Repair expense created successfully'
            });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/incidents/:id/expense
     * Get expense for an incident
     */
    static async getExpenseByIncident(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const expense = await RepairExpenseService.getExpenseByIncident(id);

            if (!expense) {
                return reply.code(404).send({ success: false, error: 'No expense found for this incident' });
            }

            return reply.send({ success: true, data: expense });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    }
}
