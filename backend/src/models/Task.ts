import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  name: string;
  description?: string;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    name: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
      maxlength: [100, 'Task name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
TaskSchema.index({ userId: 1 });
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ userId: 1, projectId: 1, name: 1 }, { unique: true });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
