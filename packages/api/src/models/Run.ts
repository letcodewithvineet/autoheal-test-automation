import mongoose, { Schema, Document } from 'mongoose';

export interface IRun extends Document {
  repo: string;
  branch: string;
  commit: string;
  ciRunId?: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  totalTests?: number;
  failedTests?: number;
  passedTests?: number;
}

const RunSchema = new Schema<IRun>({
  repo: { type: String, required: true, index: true },
  branch: { type: String, required: true },
  commit: { type: String, required: true },
  ciRunId: { type: String, index: true },
  status: { 
    type: String, 
    enum: ['running', 'completed', 'failed'],
    required: true,
    index: true
  },
  startedAt: { type: Date, default: Date.now, index: true },
  completedAt: { type: Date },
  totalTests: { type: Number },
  failedTests: { type: Number },
  passedTests: { type: Number }
}, {
  timestamps: true,
  collection: 'runs'
});

// Indexes for better query performance
RunSchema.index({ repo: 1, status: 1, startedAt: -1 });
RunSchema.index({ ciRunId: 1 });

export const RunModel = mongoose.model<IRun>('Run', RunSchema);
