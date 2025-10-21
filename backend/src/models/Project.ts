import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  color: string;
  client?: string;
  status: 'active' | 'archived';
  budget?: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    color: {
      type: String,
      required: [true, 'Project color is required'],
      default: '#3B82F6',
      match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code'],
    },
    client: {
      type: String,
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'archived'],
        message: 'Status must be either active or archived',
      },
      default: 'active',
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
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
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
