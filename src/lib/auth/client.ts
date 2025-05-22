import { adminClient, organizationClient, usernameClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/svelte"
import { PUBLIC_BETTER_AUTH_URL } from "$env/static/public"
export const authClient = createAuthClient({
    baseURL: PUBLIC_BETTER_AUTH_URL,
    plugins: [
        usernameClient(),
        adminClient(),
        organizationClient()
    ],
})

export type SessionData = typeof authClient.$Infer.Session
export type Session = typeof authClient.$Infer.Session.session
export type User = typeof authClient.$Infer.Session.user