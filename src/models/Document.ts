import mongoose, {
  Schema,
  type Document as MongooseDocument,
  type Types,
} from 'mongoose';

export interface IStoredDocument extends MongooseDocument {
  userId: Types.ObjectId;
  title: string;
  fileUrl: string;
  imageKitFileId: string;
  extractedText: string[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IStoredDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    imageKitFileId: { type: String, required: true, trim: true },
    extractedText: { type: [String], default: [] },
    summary: { type: String, trim: true },
  },
  { timestamps: true },
);

DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ imageKitFileId: 1 }, { unique: true });

const StoredDocument =
  mongoose.models.Document ||
  mongoose.model<IStoredDocument>('Document', DocumentSchema);

export default StoredDocument;
