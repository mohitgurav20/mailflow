import { RouteLeg, MailClass, RouteOption } from '@mailflow/shared-types';
/**
 * Generates an explainable, plain-English justification for the computed route.
 * Essential for Department of Posts operational confidence and hackathon judging.
 */
export declare function generateRouteRationale(params: {
    tag: RouteOption['tag'];
    mailClass: MailClass;
    legs: RouteLeg[];
    totalCostINR?: number;
    totalDurationMinutes?: number;
    confidenceScore?: number;
    carbonKg?: number;
}): string;
