import mongoose, { Schema, Document } from 'mongoose';

export interface IFailure extends Document {
  runId: string;
  repo: string;
  branch: string;
  commit: string;
  suite: string;
  test: string;
  specPath: string;
  browser: string;
  viewport: string;
  timestamp: Date;
  screenshotPath?: string;
  screenshotGridfsId?: string;
  domHtml: string;
  consoleLogs: any[];
  networkLogs: any[];
  currentSelector: string;
  selectorContext: {
    domPath?: string;
    neighbors?: string[];
    parentElements?: string[];
  };
  errorMessage?: string;
  status: 'new' | 'analyzing' | 'suggested' | 'approved' | 'rejected' | 'failed';
}

const FailureSchema = new Schema<IFailure>({
  runId: { type: String, required: true, index: true },
  repo: { type: String, required: true, index: true },
  branch: { type: String, required: true },
  commit: { type: String, required: true },
  suite: { type: String, required: true },
  test: { type: String, required: true },
  specPath: { type: String, required: true },
  browser: { type: String, required: true },
  viewport: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  screenshotPath: { type: String },
  screenshotGridfsId: { type: String },
  domHtml: { type: String, required: true },
  consoleLogs: { type: [Schema.Types.Mixed], default: [] },
  networkLogs: { type: [Schema.Types.Mixed], default: [] },
  currentSelector: { type: String, required: true },
  selectorContext: {
    domPath: String,
    neighbors: [String],
    parentElements: [String]
  },
  errorMessage: String,
  status: { 
    type: String, 
    enum: ['new', 'analyzing', 'suggested', 'approved', 'rejected', 'failed'],
    default: 'new',
    index: true
  }
}, {
  timestamps: true,
  collection: 'failures'
});

// Indexes for better query performance
FailureSchema.index({ repo: 1, status: 1, timestamp: -1 });
FailureSchema.index({ runId: 1, timestamp: -1 });
FailureSchema.index({ status: 1, timestamp: -1 });

export const FailureModel = mongoose.model<IFailure>('Failure', FailureSchema);
