import { sequence } from "@sveltejs/kit/hooks";
import * as Sentry from "@sentry/sveltekit";
import type { Handle } from "@sveltejs/kit";

Sentry.init({
    dsn: "https://5d47efb730804541a53e916f0bd27cea@sentry.incubateur.net/101",
    tracesSampleRate: 1,
});

export const handle = sequence(Sentry.sentryHandle(), (async ({ event, resolve }) => {
    event.setHeaders({
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "max-age 1800",
        "Access-Control-Allow-Origin": "*",
    });
    return resolve(event);
}) satisfies Handle);
export const handleError = Sentry.handleErrorWithSentry();
