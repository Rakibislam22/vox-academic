import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export type UserProfileInput = {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string | null;
};

type CredentialsInput = {
    name?: string;
    email: string;
    password: string;
    provider?: string;
};

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function userId(user: { _id: { toString(): string } }) {
    return user._id.toString();
}

export async function findUserByEmail(email: string) {
    await connectToDatabase();
    return User.findOne({ email: normalizeEmail(email) }).exec();
}

export async function verifyCredentialsUser(email: string, password: string) {
    const user = await findUserByEmail(email);
    if (!user || !user.password) return null;

    const passwordHash = String(user.password);
    const isValid = await bcrypt.compare(String(password), passwordHash);
    if (!isValid) return null;

    return user;
}

export async function createCredentialsUser(input: CredentialsInput) {
    await connectToDatabase();

    const normalizedEmail = normalizeEmail(input.email);
    const existingUser = await User.findOne({ email: normalizedEmail }).exec();
    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await User.create({
        name: input.name?.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: hashedPassword,
        provider: input.provider ?? 'credentials',
        lastLoginAt: new Date(),
    });

    return user;
}

export async function syncUserProfile(userData: UserProfileInput) {
    if (!userData.email) return null;

    await connectToDatabase();

    const normalizedEmail = normalizeEmail(userData.email);
    const name = userData.name?.trim() || normalizedEmail.split('@')[0];
    const provider = userData.provider ?? 'credentials';

    return User.findOneAndUpdate(
        { email: normalizedEmail },
        {
            $set: {
                name,
                email: normalizedEmail,
                image: userData.image ?? null,
                provider,
                lastLoginAt: new Date(),
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
}

export function getUserIdentifier(user: { _id?: { toString(): string }; id?: string }) {
    if (user.id) return user.id;
    if (user._id) return user._id.toString();
    return undefined;
}
