import mongoose, { Schema, Document } from 'mongoose';

export interface ISuggestion extends Document {
  failureId: string;
  candidates: Array<{
    selector: string;
    type: string;
    rationale: string;
    confidence: number;
    source: 'heuristic' | 'llm';
  }>;
  topChoice: string;
  explanationOfFailure: string;
  createdAt: Date;
}

const CandidateSchema = new Schema({
  selector: { type: String, required: true },
  type: { type: String, required: true },
  rationale: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  source: { type: String, enum: ['heuristic', 'llm'], required: true }
}, { _id: false });

const SuggestionSchema = new Schema<ISuggestion>({
  failureId: { 
    type: String, 
    required: true, 
    index: true,
    ref: 'Failure'
  },
  candidates: { type: [CandidateSchema], required: true },
  topChoice: { type: String, required: true },
  explanationOfFailure: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true,
  collection: 'suggestions'
});

// Indexes for better query performance
SuggestionSchema.index({ failureId: 1, createdAt: -1 });

export const SuggestionModel = mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
