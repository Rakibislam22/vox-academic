import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string;
  provider?: string;
  image?: string;
  lastLoginAt?: Date;
  createdAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    provider: { type: String, default: 'credentials' },
    image: { type: String },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
