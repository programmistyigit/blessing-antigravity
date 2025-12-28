import { ForecastPLService, IForecastResult, IPeriodForecastResult } from './forecast-pl.service';
import { socketManager } from '../../realtime/socket';

/**
 * Forecast WebSocket Events
 * Real-time forecast yangilanishlarini emit qilish
 */

/**
 * Section forecast yangilandi
 */
export function emitForecastSectionUpdated(
    sectionId: string,
    forecast: IForecastResult
): void {
    socketManager.broadcastToChannel(`forecast:section:${sectionId}`, 'forecast_section_updated', {
        sectionId,
        ...forecast,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Period forecast yangilandi
 */
export function emitForecastPeriodUpdated(
    periodId: string,
    forecast: IPeriodForecastResult
): void {
    socketManager.broadcastToChannel(`forecast:period:${periodId}`, 'forecast_period_updated', {
        periodId,
        ...forecast,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Section forecast'ni qayta hisoblash va emit qilish
 * Bu method trigger pointlardan chaqiriladi
 */
export async function recalculateAndEmitSectionForecast(sectionId: string): Promise<void> {
    try {
        const forecast = await ForecastPLService.getSectionForecast(sectionId);
        emitForecastSectionUpdated(sectionId, forecast);
    } catch (error) {
        console.error('Error recalculating section forecast:', error);
    }
}

/**
 * Period forecast'ni qayta hisoblash va emit qilish
 */
export async function recalculateAndEmitPeriodForecast(periodId: string): Promise<void> {
    try {
        const forecast = await ForecastPLService.getPeriodForecast(periodId);
        emitForecastPeriodUpdated(periodId, forecast);
    } catch (error) {
        console.error('Error recalculating period forecast:', error);
    }
}
