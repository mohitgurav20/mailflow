/**
 * MailFlow Shared Types & Interfaces Contract
 * SIH260461 - Dynamic Mail Transmission Solution for India Post
 * Frozen contract shared between Backend (Person 1) and Frontend (Person 2).
 */

// ----------------------------------------------------
// 1. Core Network Enums & Types
// ----------------------------------------------------

export type HubTier = 'NSH' | 'ICH' | 'PARCEL_HUB' | 'TMO' | 'DELIVERY_CENTRE';

export type TransportMode = 'AIR' | 'RAIL' | 'MMS_ROAD' | 'HIRED_ROAD' | 'WATER';

export type MailClass = 'SPEED_POST' | 'REGISTERED' | 'BULK_PARCEL';

export type ConsignmentPriority = 'CRITICAL_GOVT' | 'EXPRESS' | 'STANDARD' | 'ECONOMY';

export type ConsignmentStatus =
  | 'INDUCTED'
  | 'ROUTED'
  | 'MANIFESTED'
  | 'IN_TRANSIT'
  | 'AT_HUB'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELAYED'
  | 'EXCEPTION'
  | 'REROUTED';

export type DisruptionType =
  | 'WEATHER'
  | 'FLIGHT_CANCELLED'
  | 'TRAIN_DELAY'
  | 'ROAD_BLOCK'
  | 'HUB_CONGESTION'
  | 'STRIKE_SECURITY'
  | 'EMBARGO_RESTRICTION';

export type DisruptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BookingStatus = 'REQUESTED' | 'CONFIRMED' | 'MANIFESTED' | 'REJECTED' | 'CANCELLED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ----------------------------------------------------
// 2. Network Entities: Hub & Leg
// ----------------------------------------------------

export interface Hub {
  id: string;
  code: string;               // e.g. "DEL-NSH"
  name: string;               // e.g. "Delhi National Sorting Hub"
  circle: string;             // e.g. "Delhi Postal Circle"
  tier: HubTier;
  state: string;
  latitude: number;
  longitude: number;
  processingCapacityKg: number;
  currentLoadKg: number;
  averageSortTimeMinutes: number;
  activeEmbargoes?: string[];
  operationalStatus: 'OPERATIONAL' | 'CONGESTED' | 'DISRUPTED' | 'CLOSED';
}

export interface Leg {
  id: string;
  originHubId: string;
  destHubId: string;
  mode: TransportMode;
  carrierName: string;        // e.g. "Air India AI-860", "Howrah Mail 12810", "MMS Fleet DL-01"
  serviceCode: string;        // e.g. "AI-860", "12810-RMS", "MMS-DEL-JAI"
  departureTime: string;      // HH:mm (24h format in standard daily schedule)
  arrivalTime: string;        // HH:mm (24h format)
  durationMinutes: number;
  distanceKm: number;
  capacityKg: number;
  bookedKg: number;
  costPerKg: number;          // in INR (₹)
  baseCost: number;           // base handling fee in INR (₹)
  carbonKgPerKg: number;      // Carbon footprint estimation
  reliabilityScore: number;   // 0.0 - 1.0 EWMA metric
  activeDisruptionId?: string | null;
  cutoffTimeMinutesBeforeDeparture: number;
  status: 'ACTIVE' | 'DELAYED' | 'CANCELLED' | 'SUSPENDED';
}

// ----------------------------------------------------
// 3. Routing Engine & Route Options
// ----------------------------------------------------

export interface RouteLeg {
  legId: string;
  originHubId: string;
  destHubId: string;
  mode: TransportMode;
  carrierName: string;
  serviceCode: string;
  scheduledDeparture: string; // ISO 8601 or HH:mm
  scheduledArrival: string;   // ISO 8601 or HH:mm
  durationMinutes: number;
  cost: number;
  carbonFootprintKg: number;
  reliabilityScore: number;
  distanceKm: number;
}

export interface RouteOption {
  routeId: string;
  rank: number;               // 1 = Optimal, 2 = Alternative, 3 = Fallback/Resilient
  tag: 'OPTIMAL' | 'FASTEST' | 'ECONOMICAL' | 'RESILIENT';
  mailClass: MailClass;
  totalCost: number;          // INR (₹)
  totalDurationMinutes: number;
  departureTime: string;      // ISO String
  estimatedDeliveryTime: string; // ISO String
  confidenceScore: number;    // 0.0 - 1.0
  compositeScore: number;     // Multi-objective Dijkstra weight sum
  carbonFootprintKg: number;
  legs: RouteLeg[];
  transfersCount: number;
  rationale: string;          // Plain-English explanation for judges & DoP planners
  tradeoffs: {
    timeVsOptimalMinutes: number;
    costVsOptimalINR: number;
    reliabilityVsOptimalPct: number;
  };
}

export interface RouteComputeRequest {
  originHubId: string;
  destHubId: string;
  weightKg: number;
  volumeCubicMeters?: number;
  mailClass: MailClass;
  priority?: ConsignmentPriority;
  departureTime?: string;     // Defaults to now
  deadlineTime?: string;      // Target delivery deadline
  preferredModes?: TransportMode[];
  avoidHubs?: string[];
  avoidLegs?: string[];
  maxTransfers?: number;
}

export interface RouteComputeResponse {
  originHub: Hub;
  destHub: Hub;
  requestedAt: string;
  weightKg: number;
  mailClass: MailClass;
  options: RouteOption[];
  disruptionImpactApplied: boolean;
}

// ----------------------------------------------------
// 4. Consignment & History
// ----------------------------------------------------

export interface ConsignmentEvent {
  timestamp: string;
  locationHubId: string;
  eventType: 'INDUCTED' | 'ASSIGNED_ROUTE' | 'BOOKING_CONFIRMED' | 'LOADED' | 'IN_TRANSIT' | 'UNLOADED' | 'SORTED' | 'DISRUPTED' | 'REROUTED' | 'DELIVERED';
  description: string;
  actor?: string;
  metadata?: Record<string, any>;
}

export interface Consignment {
  id: string;
  trackingNumber: string;     // e.g. "SP-IN-2026-904812"
  trackingToken: string;      // Public URL hash token for /track/:token
  sender: {
    name: string;
    pinCode: string;
    city: string;
    email?: string;
    phone?: string;
  };
  recipient: {
    name: string;
    pinCode: string;
    city: string;
    email?: string;
    phone?: string;
  };
  originHubId: string;
  destHubId: string;
  currentHubId: string;
  currentLegId?: string | null;
  weightKg: number;
  volumeCubicMeters?: number;
  mailClass: MailClass;
  priority: ConsignmentPriority;
  status: ConsignmentStatus;
  declaredValueINR?: number;
  contentsDescription?: string;
  selectedRouteOption?: RouteOption | null;
  currentLegIndex: number;
  inductionTime: string;
  originalETA: string;
  currentETA: string;
  etaSlipMinutes: number;
  riskScore: number;          // 0.0 to 1.0
  riskLevel: RiskLevel;
  history: ConsignmentEvent[];
  lastUpdated: string;
  activeDisruptionId?: string | null;
}

// ----------------------------------------------------
// 5. Disruptions & Blast Radius
// ----------------------------------------------------

export interface DisruptionEvent {
  id: string;
  type: DisruptionType;
  severity: DisruptionSeverity;
  title: string;
  description: string;
  affectedHubId?: string | null;
  affectedLegId?: string | null;
  impactRadiusKm?: number;
  impactDeltaMinutes: number; // Delay added to traversal
  startTime: string;
  expectedEndTime: string;
  status: 'ACTIVE' | 'RESOLVING' | 'RESOLVED' | 'CANCELLED';
  source: 'MANUAL_PLANNER' | 'WEATHER_FEED' | 'CARRIER_FEED' | 'SIMULATION';
  createdAt: string;
  updatedAt: string;
}

export interface ReRouteProposal {
  consignmentId: string;
  trackingNumber: string;
  mailClass: MailClass;
  currentHubId: string;
  originalRouteId: string;
  originalETA: string;
  newRoute: RouteOption;
  newETA: string;
  deltaMinutes: number;
  costDifferenceINR: number;
  recommendedAction: 'APPLY_REROUTE' | 'HOLD_AT_HUB' | 'EXPEDITE_AIR';
  reason: string;
}

export interface BlastRadiusReport {
  disruptionId: string;
  disruption: DisruptionEvent;
  computedAt: string;
  affectedConsignmentsCount: number;
  totalVolumeWeightKg: number;
  affectedConsignments: Array<{
    consignmentId: string;
    trackingNumber: string;
    mailClass: MailClass;
    weightKg: number;
    currentHubId: string;
    riskLevel: RiskLevel;
  }>;
  proposals: ReRouteProposal[];
  summary: {
    averageDelayMinutes: number;
    additionalCostINR: number;
    canMeetDeadlineCount: number;
    slaBreachCount: number;
  };
}

// ----------------------------------------------------
// 6. Capacity Bookings & Manifest Handshake
// ----------------------------------------------------

export interface Booking {
  id: string;
  bookingRef: string;         // e.g. "BK-AI-2026-8831"
  consignmentId: string;
  legId: string;
  carrierName: string;
  serviceCode: string;
  bookedWeightKg: number;
  costINR: number;
  status: BookingStatus;
  manifestNumber?: string;
  requestedAt: string;
  confirmedAt?: string;
  notes?: string;
}

// ----------------------------------------------------
// 7. EWMA Reliability & Risk Scores
// ----------------------------------------------------

export interface ReliabilityScore {
  legId: string;
  carrierName: string;
  originHubCode: string;
  destHubCode: string;
  mode: TransportMode;
  alpha: number;              // Smoothing factor, e.g. 0.2
  ewmaScore: number;          // 0.0 - 1.0
  baselineScore: number;
  totalTripsRecorded: number;
  onTimeTrips: number;
  delayedTrips: number;
  cancelledTrips: number;
  averageDelayMinutes: number;
  lastTripTimestamp: string;
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
}

export interface RiskScore {
  consignmentId: string;
  trackingNumber: string;
  currentRiskScore: number;   // 0.0 (safe) to 1.0 (severe breach imminent)
  riskLevel: RiskLevel;
  deadlineMinutesRemaining: number;
  estimatedMinutesToDeliver: number;
  bufferMinutes: number;
  primaryRiskFactor: string;  // e.g. "Downstream Rail punctuality is 62%", "Severe monsoon at CCU"
}

// ----------------------------------------------------
// 8. Policy, Embargoes & Audit
// ----------------------------------------------------

export interface EmbargoRule {
  id: string;
  ruleCode: string;           // e.g. "EMB-JK-AIR-01"
  title: string;
  affectedHubIds: string[];
  affectedModes?: TransportMode[];
  prohibitedMailClasses?: MailClass[];
  restrictedKeywords?: string[]; // e.g. "lithium", "liquids", "perishables"
  reason: string;
  effectiveFrom: string;
  effectiveUntil: string;
  isActive: boolean;
  createdBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    userId: string;
    userName: string;
    role: 'ADMIN' | 'PLANNER' | 'OPERATOR' | 'SYSTEM';
  };
  action: string;             // e.g. "ROUTE_CONFIRMED", "DISRUPTION_TRIGGERED", "BULK_REROUTE_APPROVED"
  entityType: 'CONSIGNMENT' | 'ROUTE' | 'DISRUPTION' | 'BOOKING' | 'EMBARGO' | 'RELIABILITY';
  entityId: string;
  description: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  ipAddress?: string;
}

// ----------------------------------------------------
// 9. External Adapters (Weather & Alerts)
// ----------------------------------------------------

export interface WeatherCondition {
  hubId: string;
  hubCode: string;
  temperatureC: number;
  condition: 'CLEAR' | 'RAIN' | 'THUNDERSTORM' | 'FOG' | 'SNOW' | 'HEATWAVE';
  windSpeedKmh: number;
  visibilityMeters: number;
  isDisruptive: boolean;
  disruptionReason?: string;
  recordedAt: string;
}

export interface NotificationAlert {
  id: string;
  consignmentId: string;
  trackingNumber: string;
  recipientEmail?: string;
  recipientPhone?: string;
  alertType: 'ETA_CHANGED' | 'DISRUPTION_DELAY' | 'REROUTED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  subject: string;
  messageBody: string;
  channel: 'EMAIL' | 'SMS' | 'BOTH';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'MOCKED';
  sentAt?: string;
  trackingUrl: string;
}

// ----------------------------------------------------
// 10. Simulation Engine & Control Clock
// ----------------------------------------------------

export interface SimulationState {
  isRunning: boolean;
  currentSimTime: string;     // Accelerated virtual ISO string (e.g. 2026-08-15T08:00:00Z)
  timeSpeedMultiplier: number;// e.g. 60x (1 real sec = 1 sim min)
  elapsedSeconds: number;
  activeDisruptionsCount: number;
  activeConsignmentsCount: number;
  completedConsignmentsCount: number;
  totalReroutesCount: number;
  currentScenario: string;
}

// ----------------------------------------------------
// 11. WebSocket Event Protocol
// ----------------------------------------------------

export type WebSocketEventType =
  | 'INITIAL_STATE'
  | 'CONSIGNMENT_INDUCTED'
  | 'CONSIGNMENT_UPDATED'
  | 'CONSIGNMENT_DELIVERED'
  | 'DISRUPTION_TRIGGERED'
  | 'DISRUPTION_RESOLVED'
  | 'BLAST_RADIUS_COMPUTED'
  | 'REROUTE_APPLIED'
  | 'RELIABILITY_UPDATED'
  | 'WEATHER_ALERT'
  | 'NOTIFICATION_SENT'
  | 'SIMULATION_TICK';

export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}
