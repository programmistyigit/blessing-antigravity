import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    LEFT_EARLY = 'LEFT_EARLY',
}

export enum AttendanceArrivalSymbol {
    EARLY = '+', // Arrived early
    LATE = '-',  // Arrived late
    ON_TIME = '',
}

export interface IAttendance extends Document {
    userId: Types.ObjectId;
    sectionId: Types.ObjectId;
    date: Date;
    checkInTime: Date;
    checkOutTime?: Date;
    status: AttendanceStatus;
    arrivalDiff: number; // minutes
    arrivalSymbol: AttendanceArrivalSymbol;
    location: {
        lat: number;
        lng: number;
    };
    isFake: boolean;
    isApproved: boolean; // Field specific for approval process
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGPSMonitor extends Document {
    userId: Types.ObjectId;
    sectionId: Types.ObjectId;
    timestamp: Date;
    location: {
        lat: number;
        lng: number;
    };
    isOutsideAllowedArea: boolean;
    createdAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        checkInTime: {
            type: Date,
            required: true,
        },
        checkOutTime: {
            type: Date,
        },
        status: {
            type: String,
            enum: Object.values(AttendanceStatus),
            default: AttendanceStatus.PRESENT,
        },
        arrivalDiff: {
            type: Number,
            default: 0,
        },
        arrivalSymbol: {
            type: String,
            enum: Object.values(AttendanceArrivalSymbol),
            default: AttendanceArrivalSymbol.ON_TIME,
        },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        isFake: {
            type: Boolean,
            default: false,
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ sectionId: 1, date: -1 });

const gpsMonitorSchema = new Schema<IGPSMonitor>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        isOutsideAllowedArea: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

gpsMonitorSchema.index({ userId: 1, timestamp: -1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const GPSMonitor = mongoose.model<IGPSMonitor>('GPSMonitor', gpsMonitorSchema);
