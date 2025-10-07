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

// import CredentialsProvider from 'next-auth/providers/credentials';
// import axios from 'axios';
// import { randomBytes } from 'crypto';

// export const options = {
//   providers: [
//     CredentialsProvider({
//       name: 'credentials',
//       credentials: {
//         email: {
//           label: 'Email:',
//           type: 'text',
//           placeholder: 'Enter your email'
//         },
//         password: {
//           label: 'Password',
//           type: 'password'
//         }
//       },
//       async authorize(credentials, req) {
//         try {
//           const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
//             username: credentials?.email, // backend expects "username"
//             password: credentials?.password
//           });

//           if (res.data && res.data.accessToken) {
//             // You can pass any user object to the session
//             return {
//               id: res.data.user.id,
//               email: res.data.user.email,
//               token: res.data.accessToken,
//               name: `${res.data.user.first_name ?? ''} ${res.data.user.last_name ?? ''}`.trim(),
//               role: res.data.user.role ?? 'User'
//             };
//           }

//           return null;
//         } catch (error) {
//           console.error("Login error from backend:", error.response?.data || error.message);
//           throw new Error(error.response?.data?.message || "Login failed");
//         }
//       }
//     })
//   ],

//   secret: process.env.NEXTAUTH_SECRET,

//   pages: {
//     signIn: '/auth/sign-in'
//   },

//   callbacks: {
//     async session({ session, token }) {
//       session.user = {
//         ...session.user,
//         id: token.sub,
//         token: token.token,
//         email: token.email,
//         name: token.name,
//         role: token.role
//       };
//       return session;
//     },
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.email = user.email;
//         token.name = user.name;
//         token.role = user.role;
//         token.token = user.token;
//       }
//       return token;
//     }
//   },

//   session: {
//     strategy: 'jwt',
//     maxAge: 24 * 60 * 60,
//     generateSessionToken: () => randomBytes(32).toString('hex')
//   }
// };
// import CredentialsProvider from 'next-auth/providers/credentials';
// import { randomBytes } from 'crypto';
// export const fakeUsers = [{
//   id: '1',
//   email: 'user@demo.com',
//   username: 'demo_user',
//   password: '123456',
//   firstName: 'Demo',
//   lastName: 'User',
//   role: 'Admin',
//   token: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZWNoemFhIiwiYXVkIjoiaHR0cHM6Ly90ZWNoemFhLmdldGFwcHVpLmNvbS8iLCJzdWIiOiJzdXBwb3J0QGNvZGVydGhlbWVzLmNvbSIsImxhc3ROYW1lIjoiVGVjaHphYSIsIkVtYWlsIjoidGVjaHphYXN0dWRpb0BnbWFpbC5jb20iLCJSb2xlIjoiQWRtaW4iLCJmaXJzdE5hbWUiOiJUZXN0VG9rZW4ifQ.ud4LnFZ-mqhHEYiPf2wCLM7KvLGoAxhXTBSymRIZEFLleFkO119AXd8p3OfPCpdUWSyeZl8-pZyElANc_KHj5w'
// }];
// export const options = {
//   providers: [CredentialsProvider({
//     name: 'credentials',
//     credentials: {
//       email: {
//         label: 'Email:',
//         type: 'text',
//         placeholder: 'Enter your username'
//       },
//       password: {
//         label: 'Password',
//         type: 'password'
//       }
//     },
//     async authorize(credentials, req) {
//       const filteredUser = fakeUsers.find(user => {
//         return user.email === credentials?.email && user.password === credentials?.password;
//       });
//       if (filteredUser) {
//         return filteredUser;
//       } else {
//         throw new Error('Email or Password is not valid');
//       }
//     }
//   })],
//   secret: 'kvwLrfri/MBznUCofIoRH9+NvGu6GqvVdqO3mor1GuA=',
//   pages: {
//     signIn: '/auth/sign-in'
//   },
//   callbacks: {
//     async signIn({
//       user,
//       account,
//       profile,
//       email,
//       credentials
//     }) {
//       return true;
//     },
//     session: ({
//       session,
//       token
//     }) => {
//       session.user = {
//         email: 'user@demo.com',
//         name: 'Test User'
//       };
//       return Promise.resolve(session);
//     }
//   },
//   session: {
//     maxAge: 24 * 60 * 60 * 1000,
//     generateSessionToken: () => {
//       return randomBytes(32).toString('hex');
//     }
//   }
// };