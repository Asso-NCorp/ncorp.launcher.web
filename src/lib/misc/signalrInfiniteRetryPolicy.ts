import type { IRetryPolicy, RetryContext } from "@microsoft/signalr";

class SignalRInfiniteRetryPolicy implements IRetryPolicy {
    nextRetryDelayInMilliseconds(retryContext: RetryContext): number | null {
        console.log(`Retry attempt: ${retryContext.previousRetryCount + 1}`);
        // Retourne un délai avant de réessayer (en millisecondes)
        // Retourne null si tu veux arrêter la reconnexion
        return 5000; // Réessaye toutes les secondes
    }
}

export default SignalRInfiniteRetryPolicy;