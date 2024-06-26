import nextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { PrismaClient } from "@prisma/client";
import { NextApiHandler } from "next";

const prisma = new PrismaClient();

const handler: NextApiHandler = nextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            const email = user.email;
            let dbUser = await prisma.user.findUnique({
                where: { email },
            });

            if (!dbUser) {
                dbUser = await prisma.user.create({
                    data: {
                        email,
                        name: user.name,
                        image: user.image,
                    },
                });
            }

            user.id = dbUser.id;
            return true;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub; // Ensure user ID is being set in the session
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id.toString(); // Ensure token.sub is set to user ID
            }
            return token;
        },
    },
    // Optional: add a database adapter here if using a custom database
    // adapter: PrismaAdapter(prisma),
});

export { handler as GET, handler as POST };
