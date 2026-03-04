/**
 * TrafficGenius — NextAuth.js v5 Configuration
 *
 * Uses @auth/pg-adapter with Cloud SQL PostgreSQL.
 * Google OAuth with domain restriction to TopNetworks emails.
 *
 * @see https://authjs.dev/getting-started/adapters/pg
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import pool from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Restrict to TopNetworks domain emails
      if (account?.provider === "google" && profile?.email) {
        const allowedDomains = ["topnetworks.co", "topfinanzas.com"];
        const emailDomain = profile.email.split("@")[1];
        return allowedDomains.includes(emailDomain);
      }
      return false;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = String(user.id);
      }
      return session;
    },
  },
  trustHost: true,
});
