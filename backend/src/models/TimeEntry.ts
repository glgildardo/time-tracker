import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeEntry extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      validate: {
        validator: function (this: ITimeEntry, value: Date) {
          return !value || value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate duration
TimeEntrySchema.pre('save', function (next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor(
      (this.endTime.getTime() - this.startTime.getTime()) / 1000
    );
  }
  next();
});

// Indexes for better query performance
TimeEntrySchema.index({ userId: 1 });
TimeEntrySchema.index({ taskId: 1 });
TimeEntrySchema.index({ userId: 1, startTime: -1 });
TimeEntrySchema.index({ userId: 1, endTime: 1 }); // For active timers

export const TimeEntry = mongoose.model<ITimeEntry>(
  'TimeEntry',
  TimeEntrySchema
);
