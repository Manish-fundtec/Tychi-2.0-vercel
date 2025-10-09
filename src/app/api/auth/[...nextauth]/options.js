// options.js

import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import { randomBytes } from 'crypto';

export const options = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email:', type: 'text', placeholder: 'Enter your email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/login`, {
            username: credentials?.email,
            password: credentials?.password
          });

          const { user, accessToken } = res.data;

          if (accessToken) {
            return {
              id: user.user_id,
              email: user.email,
              token: accessToken,
              name: user.name || '',
              org_id: user.org_id
            };
          }

          return null;
        } catch (err) {
          console.error("Login error:", err.response?.data || err.message);
          throw new Error(err.response?.data?.message || "Login failed");
        }
      }
    })
  ],

  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/sign-in'
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.token = user.token;
        token.org_id = user.org_id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        token: token.token,
        org_id: token.org_id
      };
      return session;
    }
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    generateSessionToken: () => randomBytes(32).toString('hex')
  }
};