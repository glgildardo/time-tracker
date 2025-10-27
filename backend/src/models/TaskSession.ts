import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskSession extends Document {
  taskId: mongoose.Types.ObjectId;
  startAt: Date;
  endAt?: Date;
  createdAt: Date;
}

const TaskSessionSchema = new Schema<ITaskSession>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
    },
    startAt: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endAt: {
      type: Date,
      validate: {
        validator: function (this: ITaskSession, value: Date) {
          return !value || value > this.startAt;
        },
        message: 'End time must be after start time',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
TaskSessionSchema.index({ taskId: 1 });

// Unique partial index to enforce one open session per task
TaskSessionSchema.index({ taskId: 1 }, { 
  unique: true, 
  partialFilterExpression: { endAt: null }
});

export const TaskSession = mongoose.model<ITaskSession>(
  'TaskSession',
  TaskSessionSchema
);


