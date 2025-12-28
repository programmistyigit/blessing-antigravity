import { Attendance, GPSMonitor, IAttendance, AttendanceStatus, AttendanceArrivalSymbol } from './attendance.model';
import { Section, SectionStatus } from '../sections/section.model';
import { emitAttendanceCreated, emitAttendanceUpdated, emitAttendanceAlert, emitAttendanceApproved, RealtimeEvent } from '../../realtime/events';
import { startOfDay } from 'date-fns';

interface CheckInData {
    userId: string;
    sectionId: string;
    checkInTime: string;
    location: { lat: number; lng: number };
    plannedStartTime?: string;
    isFake: boolean;
}

interface AddGPSData {
    userId: string;
    sectionId: string;
    location: { lat: number; lng: number };
    isOutsideAllowedArea: boolean;
    timestamp?: string;
}

export class AttendanceService {

    static async checkIn(data: CheckInData): Promise<IAttendance> {
        const checkInDate = new Date(data.checkInTime);
        const dateStart = startOfDay(checkInDate);

        // Check if already checked in today for this section
        const existing = await Attendance.findOne({
            userId: data.userId,
            sectionId: data.sectionId,
            date: dateStart
        });

        if (existing) {
            throw new Error('User already checked in for today in this section');
        }

        const section = await Section.findById(data.sectionId);
        if (!section) throw new Error('Section not found');
        if (section.status !== SectionStatus.ACTIVE) throw new Error('Cannot check in to inactive section');

        // Logic for Planned Start Time (e.g., 08:00 AM)
        let plannedStart: Date;
        if (data.plannedStartTime) {
            plannedStart = new Date(data.plannedStartTime);
        } else {
            plannedStart = new Date(checkInDate);
            plannedStart.setHours(8, 0, 0, 0); // Default 08:00 AM
        }

        // Calculate Diff
        // Diff in minutes = (CheckIn - Planned) / 60000
        const diffMs = checkInDate.getTime() - plannedStart.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);

        let symbol = AttendanceArrivalSymbol.ON_TIME;
        let status = AttendanceStatus.PRESENT;

        if (diffMinutes < 0) {
            symbol = AttendanceArrivalSymbol.EARLY; // Negative diff (Arrived before 8:00)
        } else if (diffMinutes > 0) {
            symbol = AttendanceArrivalSymbol.LATE; // Positive diff (Arrived after 8:00)
            status = AttendanceStatus.LATE;
        }

        const attendance = new Attendance({
            userId: data.userId,
            sectionId: data.sectionId,
            date: dateStart,
            checkInTime: checkInDate,
            location: data.location,
            status,
            arrivalDiff: diffMinutes,
            arrivalSymbol: symbol,
            isFake: data.isFake,
            createdBy: data.userId,
        });

        await attendance.save();
        emitAttendanceCreated(attendance);

        // Alerts
        if (status === AttendanceStatus.LATE) {
            emitAttendanceAlert(RealtimeEvent.ATTENDANCE_LATE_ALERT, {
                sectionId: section._id,
                attendanceId: attendance._id,
                userId: data.userId,
                diff: diffMinutes,
                message: `⚠️ User arrived late by ${diffMinutes} minutes`,
                severity: 'warning'
            });
        }

        if (symbol === AttendanceArrivalSymbol.EARLY && Math.abs(diffMinutes) > 30) {
            emitAttendanceAlert(RealtimeEvent.ATTENDANCE_EARLY_ALERT, {
                sectionId: section._id,
                attendanceId: attendance._id,
                userId: data.userId,
                diff: diffMinutes,
                message: `ℹ️ User arrived early by ${Math.abs(diffMinutes)} minutes`,
                severity: 'info'
            });
        }

        if (data.isFake) {
            emitAttendanceAlert(RealtimeEvent.ATTENDANCE_FAKE_DETECTED, {
                sectionId: section._id,
                attendanceId: attendance._id,
                userId: data.userId,
                message: `🛑 Fake Check-in detected for user`,
                severity: 'critical'
            });
        }

        return attendance;
    }

    static async checkOut(id: string, checkOutTime: string): Promise<IAttendance> {
        const attendance = await Attendance.findById(id);
        if (!attendance) throw new Error('Attendance record not found');

        const outTime = new Date(checkOutTime);
        if (outTime < attendance.checkInTime) {
            throw new Error('Check-out time cannot be before check-in time');
        }

        attendance.checkOutTime = outTime;

        // Check "Left Early" logic? Usually depends on Shift End. 
        // Not explicitly asked to calculate Left Early Diff, just "+/- arrival". 
        // But status enum has 'LEFT_EARLY'.
        // Assuming we keep status as LATE or PRESENT unless strictly LEFT_EARLY logic is defined.
        // I'll leave status as is unless update is forced, or if I assume shift end is 17:00?
        // Let's rely on manual status update or just setting checkOutTime for now.

        await attendance.save();
        emitAttendanceUpdated(attendance);
        return attendance;
    }

    static async updateAttendance(id: string, updates: any): Promise<IAttendance> {
        const attendance = await Attendance.findById(id);
        if (!attendance) throw new Error('Attendance record not found');

        if (updates.status) attendance.status = updates.status;
        if (updates.checkOutTime) attendance.checkOutTime = new Date(updates.checkOutTime);
        // ... other allowed updates

        await attendance.save();
        emitAttendanceUpdated(attendance);
        return attendance;
    }

    static async approveAttendance(id: string): Promise<IAttendance> {
        const attendance = await Attendance.findById(id);
        if (!attendance) throw new Error('Attendance record not found');

        attendance.isApproved = true;
        await attendance.save();
        emitAttendanceApproved(attendance);
        return attendance;
    }

    static async deleteAttendance(id: string): Promise<void> {
        const attendance = await Attendance.findById(id);
        if (!attendance) throw new Error('Attendance record not found');
        await attendance.deleteOne();
        // Emit delete event? Not defined in requirements but good practice.
    }

    static async getAttendanceBySection(sectionId: string, date?: string): Promise<IAttendance[]> {
        const query: any = { sectionId };
        if (date) {
            query.date = startOfDay(new Date(date));
        }
        return Attendance.find(query).sort({ checkInTime: -1 }).populate('userId', 'fullName username');
    }

    static async logGPS(data: AddGPSData) {
        const gps = new GPSMonitor({
            userId: data.userId,
            sectionId: data.sectionId,
            location: data.location,
            isOutsideAllowedArea: data.isOutsideAllowedArea,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        });

        await gps.save();

        if (data.isOutsideAllowedArea) {
            emitAttendanceAlert(RealtimeEvent.ATTENDANCE_FAKE_DETECTED, {
                sectionId: data.sectionId,
                userId: data.userId,
                location: data.location,
                message: `🛑 GPS Alert: User is outside allowed area`,
                severity: 'critical'
            });

            // Mark current attendance as fake if active?
            // Optionally find today's attendance and mark isFake = true
            const dateStart = startOfDay(new Date());
            const attendance = await Attendance.findOne({ userId: data.userId, sectionId: data.sectionId, date: dateStart });
            if (attendance) {
                attendance.isFake = true;
                await attendance.save();
                emitAttendanceUpdated(attendance);
            }
        }
    }

    static async getGPSHistory(sectionId: string, userId: string): Promise<any[]> {
        return GPSMonitor.find({ sectionId, userId }).sort({ timestamp: -1 }).limit(100);
    }
}
