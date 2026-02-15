import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Build providers array dynamically based on available credentials
const providers = [];

// Google OAuth (only add if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Apple OAuth (only add if credentials are configured)
if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    })
  );
}

// PIN-based authentication (always available)
providers.push(
  Credentials({
      name: "PIN",
      credentials: {
        username: { label: "Username", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.pin) {
          return null;
        }

        const username = credentials.username as string;
        const pin = credentials.pin as string;

        // Find user by username
        const user = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .get();

        if (!user || !user.pinHash) {
          return null;
        }

        // Verify PIN
        const isValid = await bcrypt.compare(pin, user.pinHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name || user.username,
          email: user.email,
          image: user.image,
        };
      },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

// Helper function to hash PIN
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

// Helper function to create a PIN user
export async function createPinUser(
  username: string,
  pin: string,
  name?: string
) {
  const pinHash = await hashPin(pin);
  const id = crypto.randomUUID();

  await db.insert(users).values({
    id,
    username,
    pinHash,
    name: name || username,
    createdAt: new Date(),
  });

  return { id, username, name: name || username };
}
