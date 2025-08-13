import mongoose, { Schema, Document } from 'mongoose';

export interface IApproval extends Document {
  suggestionId: string;
  approvedBy: string;
  decision: 'approve' | 'reject';
  notes?: string;
  createdAt: Date;
}

const ApprovalSchema = new Schema<IApproval>({
  suggestionId: { 
    type: String, 
    required: true, 
    index: true,
    ref: 'Suggestion'
  },
  approvedBy: { type: String, required: true },
  decision: { 
    type: String, 
    enum: ['approve', 'reject'], 
    required: true,
    index: true
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true,
  collection: 'approvals'
});

// Indexes for better query performance
ApprovalSchema.index({ suggestionId: 1, createdAt: -1 });
ApprovalSchema.index({ approvedBy: 1, createdAt: -1 });
ApprovalSchema.index({ decision: 1, createdAt: -1 });

export const ApprovalModel = mongoose.model<IApproval>('Approval', ApprovalSchema);
