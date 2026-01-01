import { CompanySettings, ICompanySettings } from './company.model';

interface LocationData {
    lat: number;
    lng: number;
    radius?: number;
}

export class CompanyService {

    /**
     * Get or create company settings
     */
    static async getSettings(): Promise<ICompanySettings> {
        let settings = await CompanySettings.findOne();
        if (!settings) {
            settings = await CompanySettings.create({});
        }
        return settings;
    }

    /**
     * Get company location
     */
    static async getLocation(): Promise<{ lat: number; lng: number; radius: number } | null> {
        const settings = await this.getSettings();
        return settings.location;
    }

    /**
     * Update company location
     */
    static async updateLocation(data: LocationData): Promise<ICompanySettings> {
        let settings = await CompanySettings.findOne();
        if (!settings) {
            settings = await CompanySettings.create({
                location: {
                    lat: data.lat,
                    lng: data.lng,
                    radius: data.radius || 100,
                },
            });
        } else {
            settings.location = {
                lat: data.lat,
                lng: data.lng,
                radius: data.radius || 100,
            };
            await settings.save();
        }
        return settings;
    }

    /**
     * Check if a location is within company allowed radius
     * Returns true if within radius, false otherwise
     */
    static async isWithinAllowedRadius(userLat: number, userLng: number): Promise<{ allowed: boolean; distance: number }> {
        const location = await this.getLocation();
        if (!location) {
            // No location set - allow by default
            return { allowed: true, distance: 0 };
        }

        const distance = this.calculateDistance(
            location.lat,
            location.lng,
            userLat,
            userLng
        );

        return {
            allowed: distance <= location.radius,
            distance: Math.round(distance),
        };
    }

    /**
     * Calculate distance between two GPS points using Haversine formula
     * Returns distance in meters
     */
    private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000; // Earth radius in meters
        const dLat = this.deg2rad(lat2 - lat1);
        const dLng = this.deg2rad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
