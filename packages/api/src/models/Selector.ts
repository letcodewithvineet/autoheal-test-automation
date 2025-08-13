import mongoose, { Schema, Document } from 'mongoose';

export interface ISelector extends Document {
  page: string;
  name: string;
  current: string;
  history: Array<{
    selector: string;
    commit: string;
    approvedAt: Date;
    approvedBy?: string;
  }>;
}

const HistoryEntrySchema = new Schema({
  selector: { type: String, required: true },
  commit: { type: String, required: true },
  approvedAt: { type: Date, required: true },
  approvedBy: { type: String }
}, { _id: false });

const SelectorSchema = new Schema<ISelector>({
  page: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  current: { type: String, required: true },
  history: { type: [HistoryEntrySchema], default: [] }
}, {
  timestamps: true,
  collection: 'selectors'
});

// Compound index for unique page/name combination
SelectorSchema.index({ page: 1, name: 1 }, { unique: true });

export const SelectorModel = mongoose.model<ISelector>('Selector', SelectorSchema);
