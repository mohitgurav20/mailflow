export type HubType = 'NSH' | 'ICH' | 'PARCEL_HUB' | 'RMS' | 'TMO';

export type HubStatus = 'OPERATIONAL' | 'CONGESTED' | 'DISRUPTED';

export interface Hub {
  id: string;
  code: string;
  name: string;
  type: HubType;
  circle: string;
  lat: number;
  lng: number;
  capacityPerDayKg: number;
  currentWorkloadKg: number;
  status: HubStatus;
}

export type TransportMode =
  | 'MMS_ROAD'
  | 'HIRED_ROAD'
  | 'RMS_RAIL'
  | 'COMMERCIAL_AIR'
  | 'SURFACE_WATER';

export type LegStatus = 'ACTIVE' | 'DELAYED' | 'CANCELLED' | 'BLOCKED';

export interface TransportLeg {
  id: string;
  code: string;
  originHubId: string;
  destHubId: string;
  mode: TransportMode;
  carrierName: string;
  departureTime: string; // HH:mm format
  arrivalTime: string;   // HH:mm format
  durationHours: number;
  distanceKm: number;
  maxWeightKg: number;
  availableCapacityKg: number;
  costPerKg: number;
  baseReliability: number; // 0 - 1.0 scale
  ewmaReliability: number; // 0 - 1.0 scale evolving score
  status: LegStatus;
  delayHours?: number;
}

export type MailClass =
  | 'SPEED_POST'
  | 'REGISTERED_PARCEL'
  | 'BUSINESS_PARCEL'
  | 'BULK_MAIL';

export type ConsignmentStatus =
  | 'INDUCTED'
  | 'IN_TRANSIT'
  | 'REROUTED'
  | 'DELIVERED'
  | 'DELAYED_RISK';

export interface TimelineScanEvent {
  id: string;
  timestamp: string;
  hubId: string;
  hubName: string;
  statusText: string;
  location: string;
}

export interface Consignment {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderCity: string;
  receiverName: string;
  receiverCity: string;
  originHubId: string;
  destHubId: string;
  weightKg: number;
  mailClass: MailClass;
  status: ConsignmentStatus;
  currentHubId: string;
  currentLegId?: string;
  targetSlaHours: number;
  elapsedHours: number;
  originalEta: string;
  currentEta: string;
  isDelayedRisk: boolean;
  delayReason?: string;
  timeline: TimelineScanEvent[];
  assignedRouteLegIds: string[];
}

export interface RouteOption {
  id: string;
  consignmentId?: string;
  rank: 1 | 2 | 3; // 1 = Fastest, 2 = Highest Reliability, 3 = Cost Optimal
  title: string;
  totalDurationHours: number;
  totalCost: number;
  totalDistanceKm: number;
  compositeReliability: number;
  legs: TransportLeg[];
  rationale: string;
  spaceReserved: boolean;
}

export type DisruptionType =
  | 'AIR_CANCELLATION'
  | 'RAIL_DELAY'
  | 'ROAD_BLOCK'
  | 'HUB_OVERFLOW'
  | 'WEATHER_ALERT';

export type DisruptionSeverity = 'MINOR' | 'MODERATE' | 'CRITICAL';

export interface Disruption {
  id: string;
  type: DisruptionType;
  title: string;
  description: string;
  affectedLegIds: string[];
  affectedHubIds: string[];
  severity: DisruptionSeverity;
  startTime: string;
  estimatedEndTime: string;
  active: boolean;
}

export interface RerouteProposal {
  consignmentId: string;
  trackingNumber: string;
  currentLocation: string;
  destination: string;
  mailClass: MailClass;
  originalRouteLegIds: string[];
  newRouteOption: RouteOption;
  deltaEtaHours: number;
}

export interface BlastRadiusResult {
  disruptionId: string;
  disruptionTitle: string;
  totalConsignmentsAffected: number;
  avgAddedDelayHours: number;
  proposals: RerouteProposal[];
}

export interface EmbargoRule {
  id: string;
  regionCircle: string;
  hubId?: string;
  restrictedMailClasses: MailClass[];
  reason: string;
  activeFrom: string;
  activeTo: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole: 'PLANNER' | 'DISPATCHER' | 'ADMIN';
  action: string;
  details: string;
}
