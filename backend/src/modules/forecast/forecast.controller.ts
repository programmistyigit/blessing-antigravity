import { FastifyRequest, FastifyReply } from 'fastify';
import { ForecastPriceService } from './forecast-price.service';
import { ForecastPLService } from './forecast-pl.service';

/**
 * Forecast Controller
 * Forecast P&L API endpoints
 */
export class ForecastController {
    /**
     * POST /forecast/price
     * Set initial forecast price (Director only)
     */
    static async setPrice(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            const user = (request as any).user;
            const body = request.body as {
                periodId: string;
                sectionId?: string;
                pricePerKg: number;
            };

            if (!body.periodId || !body.pricePerKg) {
                return reply.status(400).send({
                    success: false,
                    error: 'periodId va pricePerKg majburiy',
                });
            }

            const price = await ForecastPriceService.setInitialPrice({
                periodId: body.periodId,
                sectionId: body.sectionId,
                pricePerKg: body.pricePerKg,
                createdBy: user.userId,
            });

            return reply.status(201).send({
                success: true,
                data: price,
                message: 'Forecast narxi saqlandi',
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /forecast/sections/:id
     * Get section forecast
     */
    static async getSectionForecast(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const forecast = await ForecastPLService.getSectionForecast(id);

            return reply.status(200).send({
                success: true,
                data: forecast,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /forecast/periods/:id
     * Get period forecast (all sections)
     */
    static async getPeriodForecast(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const forecast = await ForecastPLService.getPeriodForecast(id);

            return reply.status(200).send({
                success: true,
                data: forecast,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /forecast/simulate
     * Simulate partial sale (what-if)
     */
    static async simulate(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            const body = request.body as {
                batchId: string;
                soldChicks: number;
                pricePerKg: number;
            };

            if (!body.batchId || !body.soldChicks || !body.pricePerKg) {
                return reply.status(400).send({
                    success: false,
                    error: 'batchId, soldChicks va pricePerKg majburiy',
                });
            }

            const result = await ForecastPLService.simulatePartialSale(
                body.batchId,
                body.soldChicks,
                body.pricePerKg
            );

            return reply.status(200).send({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: error.message,
            });
        }
    }
}
