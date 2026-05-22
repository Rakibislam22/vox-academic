import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPDFDocument extends Document {
    title?: string;
    filename: string;
    url?: string;
    owner: Types.ObjectId;
    pages?: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const PDFSchema: Schema = new Schema<IPDFDocument>(
    {
        title: { type: String },
        filename: { type: String, required: true },
        url: { type: String },
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        pages: { type: Number },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

const PDFDocument = mongoose.models.PDFDocument || mongoose.model<IPDFDocument>('PDFDocument', PDFSchema);
export default PDFDocument;
