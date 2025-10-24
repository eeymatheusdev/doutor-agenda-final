import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { usersTable, usersToClinicsTable } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const [userData, clinics] = await Promise.all([
        db.query.usersTable.findFirst({
          where: eq(usersTable.id, user.id),
          // Explicitly select the needed fields
          columns: {
            plan: true,
            stripeSubscriptionId: true,
            stripeCustomerId: true,
          },
        }),
        db.query.usersToClinicsTable.findMany({
          where: eq(usersToClinicsTable.userId, user.id),
          with: {
            clinic: true,
            user: true, // User might not be needed here if only clinic info is used
          },
        }),
      ]);
      const clinic = clinics?.[0];
      return {
        user: {
          ...user, // Include base user fields like id, name, email, etc.
          plan: userData?.plan,
          // *** ADDED stripeSubscriptionId and stripeCustomerId ***
          stripeSubscriptionId: userData?.stripeSubscriptionId,
          stripeCustomerId: userData?.stripeCustomerId,
          // *** END ADDED ***
          clinic: clinic?.clinicId
            ? {
                id: clinic?.clinicId,
                name: clinic?.clinic?.name,
                logoUrl: clinic?.clinic?.logoUrl,
              }
            : undefined,
        },
        session,
      };
    }),
  ],
  user: {
    modelName: "usersTable",
    additionalFields: {
      stripeCustomerId: {
        type: "string",
        fieldName: "stripeCustomerId",
        required: false,
      },
      stripeSubscriptionId: {
        type: "string",
        fieldName: "stripeSubscriptionId",
        required: false,
      },
      plan: {
        type: "string",
        fieldName: "plan",
        required: false,
      },
    },
  },
  session: {
    modelName: "sessionsTable",
  },
  account: {
    modelName: "accountsTable",
  },
  verification: {
    modelName: "verificationsTable",
  },
  emailAndPassword: {
    enabled: true,
  },
});

// Explicitly define the SessionUser type if needed elsewhere, inferring from the customSession return
// This helps TypeScript understand the final shape of session.user
export type CustomSessionUser = Awaited<
  ReturnType<ReturnType<typeof customSession<typeof auth>>["__init__"]>
>["user"];
