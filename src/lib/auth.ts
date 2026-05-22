import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import type { JWT } from 'next-auth/jwt';
import { syncUserProfile, verifyCredentialsUser, findUserByEmail } from './user-store';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

type GoogleProfile = {
    name?: string | null;
    email?: string | null;
    picture?: string | null;
};

type AppToken = JWT & {
    user?: {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        provider?: string | null;
    };
};

export const authConfig: NextAuthConfig = {
    trustHost: true,
    session: { strategy: 'jwt' as const },
    pages: {
        signIn: '/login',
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await verifyCredentialsUser(String(credentials.email), String(credentials.password));
                if (!user) return null;

                return {
                    id: 'id' in user ? user.id : user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: 'image' in user ? user.image : undefined,
                };
            },
        }),
        ...(googleClientId && googleClientSecret
            ? [
                GoogleProvider({
                    clientId: googleClientId,
                    clientSecret: googleClientSecret,
                }),
              ]
            : []),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                // Fixed: Conditional routing ensuring syncUserProfile runs only once per login event
                if (account?.provider === 'google' && profile) {
                    const googleProfile = profile as GoogleProfile;
                    await syncUserProfile({
                        id: user.id,
                        name: googleProfile.name ?? user.name,
                        email: googleProfile.email ?? user.email,
                        image: googleProfile.picture ?? user.image,
                        provider: 'google',
                    });
                } else {
                    await syncUserProfile({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        provider: account?.provider ?? 'credentials',
                    });
                }
                return true;
            } catch (error) {
                console.error('User sync failed during sign-in:', error);
                // Return false if database operation fails completely to avoid stealth lockouts
                return false; 
            }
        },
        // Fixed: Explicit redirect loop management targeting /dashboard safely
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return `${baseUrl}/dashboard`;
        },
        async jwt({ token, user, account }) {
            const appToken = token as AppToken;
            if (user) {
                appToken.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    provider: account?.provider ?? 'credentials',
                };
            } else if (appToken.user?.email) {
                try {
                    const persistedUser = await findUserByEmail(appToken.user.email);
                    if (persistedUser) {
                        appToken.user = {
                            id: 'id' in persistedUser ? persistedUser.id : persistedUser._id.toString(),
                            name: persistedUser.name,
                            email: persistedUser.email,
                            image: 'image' in persistedUser ? persistedUser.image ?? undefined : persistedUser.image,
                            provider: 'provider' in persistedUser ? persistedUser.provider ?? undefined : persistedUser.provider,
                        };
                    }
                } catch (error) {
                    console.error('Failed to hydrate user from database:', error);
                }
            }
            return appToken;
        },
        async session({ session, token }) {
            const appToken = token as AppToken;
            if (appToken.user?.id) session.user.id = appToken.user.id;
            if (appToken.user?.provider) session.user.provider = appToken.user.provider;
            if (typeof appToken.user?.name === 'string') session.user.name = appToken.user.name;
            if (typeof appToken.user?.email === 'string') session.user.email = appToken.user.email;
            if (typeof appToken.user?.image === 'string') session.user.image = appToken.user.image;
            return session;
        },
    },
    secret: authSecret,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export default authConfig;

