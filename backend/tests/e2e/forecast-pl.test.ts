import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../src/core/database';
import { initializeDatabase } from '../../src/utils/init.util';

// Models
import { Period } from '../../src/modules/periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../../src/modules/periods/period-expense.model';
import { Section } from '../../src/modules/sections/section.model';
import { Batch } from '../../src/modules/sections/batch.model';
import { SectionDailyReport } from '../../src/modules/sections/report.model';
import { User } from '../../src/modules/users/user.model';
import { Role } from '../../src/modules/roles/role.model';
import { ForecastPrice, ForecastPriceSource } from '../../src/modules/forecast/forecast-price.model';

// Services
import { ForecastPLService } from '../../src/modules/forecast/forecast-pl.service';
import { ForecastPriceService } from '../../src/modules/forecast/forecast-price.service';

describe('Forecast P&L E2E Tests', () => {
    let directorUser: any;

    beforeAll(async () => {
        await connectDatabase();
        await initializeDatabase();

        // Find or create director
        let directorRole = await Role.findOne({ name: 'Director' });
        if (!directorRole) {
            directorRole = await Role.create({
                name: 'Director',
                permissions: ['SYSTEM_ALL'],
                isSystem: true
            });
        }

        let director = await User.findOne({ username: 'test_director_forecast' });
        if (!director) {
            director = await User.create({
                username: 'test_director_forecast',
                passwordHash: 'hashed',
                fullName: 'Test Director Forecast',
                role: directorRole._id,
                isActive: true
            });
        }
        directorUser = director;
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    it('Test 1: No price set → BLOCKED with PRICE_NOT_SET', async () => {
        // Setup: Create period, section, batch, and report (but NO price)
        const period = await Period.create({
            name: 'Forecast Test 1 ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Forecast Section 1 ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 5000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        // Add a report with avgWeight
        await SectionDailyReport.create({
            batchId: batch._id,
            date: new Date(),
            avgWeight: 2.5,
            totalWeight: 12500,
            deaths: 10,
            feedUsedKg: 100,
            waterUsedLiters: 200,
            electricityUsedKwh: 50,
            createdBy: directorUser._id
        });

        // Get forecast - should be BLOCKED
        const forecast = await ForecastPLService.getSectionForecast(section._id.toString());

        expect(forecast.status).toBe('BLOCKED');
        expect(forecast.reason).toBe('PRICE_NOT_SET');

        // Cleanup
        await SectionDailyReport.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 2: No avgWeight → BLOCKED with INSUFFICIENT_DATA', async () => {
        // Setup without report
        const period = await Period.create({
            name: 'Forecast Test 2 ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Forecast Section 2 ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 5000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        // Set price but NO report
        await ForecastPriceService.setInitialPrice({
            periodId: period._id.toString(),
            pricePerKg: 20000,
            createdBy: directorUser._id.toString()
        });

        const forecast = await ForecastPLService.getSectionForecast(section._id.toString());

        expect(forecast.status).toBe('BLOCKED');
        expect(forecast.reason).toBe('INSUFFICIENT_DATA');
        expect(forecast.missing).toContain('avgWeight');

        // Cleanup
        await ForecastPrice.deleteMany({ periodId: period._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 3: Price set + report exists → SUCCESS with calculations', async () => {
        const period = await Period.create({
            name: 'Forecast Test 3 ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Forecast Section 3 ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 10000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        // Add report
        await SectionDailyReport.create({
            batchId: batch._id,
            date: new Date(),
            avgWeight: 2.0,
            totalWeight: 20000,
            deaths: 100,
            feedUsedKg: 500,
            waterUsedLiters: 1000,
            electricityUsedKwh: 200,
            createdBy: directorUser._id
        });

        // Set price
        await ForecastPriceService.setInitialPrice({
            periodId: period._id.toString(),
            pricePerKg: 15000,
            createdBy: directorUser._id.toString()
        });

        const forecast = await ForecastPLService.getSectionForecast(section._id.toString());

        expect(forecast.status).toBe('SUCCESS');
        expect(forecast.aliveChicks).toBe(9900); // 10000 - 100 deaths
        expect(forecast.avgWeight).toBe(2.0);
        expect(forecast.forecastPricePerKg).toBe(15000);
        // Revenue = 9900 * 2.0 * 15000 = 297,000,000
        expect(forecast.estimatedRevenue).toBe(297000000);

        // Cleanup
        await ForecastPrice.deleteMany({ periodId: period._id });
        await SectionDailyReport.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 4: Expense added → forecast costs updated', async () => {
        const period = await Period.create({
            name: 'Forecast Test 4 ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Forecast Section 4 ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 5000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        await SectionDailyReport.create({
            batchId: batch._id,
            date: new Date(),
            avgWeight: 2.5,
            totalWeight: 12500,
            deaths: 0,
            feedUsedKg: 100,
            waterUsedLiters: 200,
            electricityUsedKwh: 50,
            createdBy: directorUser._id
        });

        await ForecastPriceService.setInitialPrice({
            periodId: period._id.toString(),
            pricePerKg: 20000,
            createdBy: directorUser._id.toString()
        });

        // Add expense
        await PeriodExpense.create({
            periodId: period._id,
            sectionId: section._id,
            category: ExpenseCategory.ELECTRICITY,
            amount: 5000000,
            expenseDate: new Date(),
            createdBy: directorUser._id
        });

        const forecast = await ForecastPLService.getSectionForecast(section._id.toString());

        expect(forecast.status).toBe('SUCCESS');
        expect(forecast.estimatedCosts).toBe(5000000);
        // Profit = Revenue - Costs
        const expectedRevenue = 5000 * 2.5 * 20000; // 250,000,000
        expect(forecast.estimatedProfit).toBe(expectedRevenue - 5000000);

        // Cleanup
        await PeriodExpense.deleteMany({ sectionId: section._id });
        await ForecastPrice.deleteMany({ periodId: period._id });
        await SectionDailyReport.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 5: simulatePartialSale returns data, saves nothing', async () => {
        const period = await Period.create({
            name: 'Forecast Test 5 ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Forecast Section 5 ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 10000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        await SectionDailyReport.create({
            batchId: batch._id,
            date: new Date(),
            avgWeight: 2.0,
            totalWeight: 20000,
            deaths: 0,
            feedUsedKg: 100,
            waterUsedLiters: 200,
            electricityUsedKwh: 50,
            createdBy: directorUser._id
        });

        // Simulate selling 3000 chicks at 18000/kg
        const result = await ForecastPLService.simulatePartialSale(
            batch._id.toString(),
            3000,
            18000
        );

        expect(result.status).toBe('SUCCESS');
        expect(result.soldChicks).toBe(3000);
        expect(result.aliveChicks).toBe(7000); // 10000 - 3000

        // Verify nothing was saved - ChickOut count should still be 0
        const { ChickOut } = await import('../../src/modules/sections/chick-out.model');
        const chickOutCount = await ChickOut.countDocuments({ batchId: batch._id });
        expect(chickOutCount).toBe(0);

        // Cleanup
        await SectionDailyReport.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });

    it('Test 6: soldChicks > aliveChicks → BLOCKED', async () => {
        const period = await Period.create({
            name: 'Forecast Test 6 ' + Date.now(),
            startDate: new Date(),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        const section = await Section.create({
            name: 'Forecast Section 6 ' + Date.now(),
            status: 'ACTIVE',
            activePeriodId: period._id,
            createdBy: directorUser._id
        });

        const batch = await Batch.create({
            sectionId: section._id,
            periodId: period._id,
            totalChicksIn: 1000,
            startedAt: new Date(),
            expectedEndAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: directorUser._id
        });

        await SectionDailyReport.create({
            batchId: batch._id,
            date: new Date(),
            avgWeight: 2.0,
            totalWeight: 2000,
            deaths: 0,
            feedUsedKg: 50,
            waterUsedLiters: 100,
            electricityUsedKwh: 20,
            createdBy: directorUser._id
        });

        // Try to sell more than available
        const result = await ForecastPLService.simulatePartialSale(
            batch._id.toString(),
            2000, // More than 1000 available
            18000
        );

        expect(result.status).toBe('BLOCKED');
        expect(result.message).toContain('yetarli joja');

        // Cleanup
        await SectionDailyReport.deleteMany({ batchId: batch._id });
        await Batch.findByIdAndDelete(batch._id);
        await Section.findByIdAndDelete(section._id);
        await Period.findByIdAndDelete(period._id);
    });
});
