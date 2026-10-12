// Lokalni ključevi vezani za firmu (business_id). Stari globalni ključevi se ignorišu.
export const monthlyGoalKey = (businessId: string) => `poslo-monthly-goal:${businessId}`;
export const lastSeenKey = (businessId: string) => `poslo-last-seen:${businessId}`;
export const bookingLinkKey = (businessId: string) => `poslo-booking-link:${businessId}`;
