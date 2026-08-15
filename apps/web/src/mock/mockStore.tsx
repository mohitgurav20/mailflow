import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Hub,
  TransportLeg,
  Consignment,
  Disruption,
  RouteOption,
  BlastRadiusResult,
  RerouteProposal,
  EmbargoRule,
  AuditLog,
  MailClass
} from '@mailflow/shared-types';
import { INITIAL_HUBS } from './hubs';
import { INITIAL_LEGS } from './legs';
import { INITIAL_CONSIGNMENTS } from './consignments';
import { INITIAL_DISRUPTIONS } from './disruptions';

interface MockStoreContextType {
  hubs: Hub[];
  legs: TransportLeg[];
  consignments: Consignment[];
  disruptions: Disruption[];
  embargos: EmbargoRule[];
  auditLogs: AuditLog[];
  simulationTime: Date;
  isClockRunning: boolean;
  activeView: string;
  userRole: 'PLANNER' | 'DISPATCHER' | 'ADMIN';
  demoMode: boolean;
  
  setActiveView: (view: string) => void;
  setUserRole: (role: 'PLANNER' | 'DISPATCHER' | 'ADMIN') => void;
  toggleClock: () => void;
  toggleDemoMode: () => void;
  
  // Actions
  computeRouteOptions: (
    originHubId: string,
    destHubId: string,
    weightKg: number,
    mailClass: MailClass
  ) => RouteOption[];
  
  inductConsignment: (
    data: Omit<Consignment, 'id' | 'trackingNumber' | 'status' | 'elapsedHours' | 'timeline' | 'isDelayedRisk'>,
    chosenRoute: RouteOption
  ) => Consignment;
  
  toggleDisruption: (disruptionId: string) => void;
  addDisruption: (disruption: Omit<Disruption, 'id'>) => void;
  
  calculateBlastRadius: (disruptionId: string) => BlastRadiusResult | null;
  executeBulkReroute: (result: BlastRadiusResult) => void;
  
  addEmbargoRule: (rule: Omit<EmbargoRule, 'id'>) => void;
  removeEmbargoRule: (id: string) => void;
}

const MockStoreContext = createContext<MockStoreContextType | null>(null);

export const MockStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hubs, setHubs] = useState<Hub[]>(INITIAL_HUBS);
  const [legs, setLegs] = useState<TransportLeg[]>(INITIAL_LEGS);
  const [consignments, setConsignments] = useState<Consignment[]>(INITIAL_CONSIGNMENTS);
  const [disruptions, setDisruptions] = useState<Disruption[]>(INITIAL_DISRUPTIONS);
  const [activeView, setActiveView] = useState<string>('control-tower');
  const [userRole, setUserRole] = useState<'PLANNER' | 'DISPATCHER' | 'ADMIN'>('PLANNER');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  
  const [simulationTime, setSimulationTime] = useState<Date>(new Date('2026-08-15T12:00:00'));
  const [isClockRunning, setIsClockRunning] = useState<boolean>(true);

  const [embargos, setEmbargos] = useState<EmbargoRule[]>([
    {
      id: 'embargo-01',
      regionCircle: 'Jammu & Kashmir',
      hubId: 'hub-jammu',
      restrictedMailClasses: ['BUSINESS_PARCEL', 'BULK_MAIL'],
      reason: 'Heavy Security Convoy Movement on NH-44',
      activeFrom: '2026-08-15',
      activeTo: '2026-08-18'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      timestamp: '2026-08-15 08:30:12',
      userRole: 'PLANNER',
      action: 'CONSIGNMENT_INDUCTED',
      details: 'SP892019482IN inducted at Delhi NSH. Assigned Air India Cargo AI-807.'
    },
    {
      id: 'log-2',
      timestamp: '2026-08-15 07:05:00',
      userRole: 'ADMIN',
      action: 'DISRUPTION_FLAGGED',
      details: 'Air cancellation flagged on leg AIR-DEL-BOM-101 due to Monsoonal Thunderstorm.'
    }
  ]);

  // Clock Ticker
  useEffect(() => {
    let interval: any;
    if (isClockRunning) {
      interval = setInterval(() => {
        setSimulationTime((prev) => new Date(prev.getTime() + 60000)); // Advance 1 min per second
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockRunning]);

  const toggleClock = () => setIsClockRunning(!isClockRunning);
  const toggleDemoMode = () => setDemoMode(!demoMode);

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: simulationTime.toISOString().replace('T', ' ').substring(0, 19),
      userRole,
      action,
      details
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Multimodal Route Generation Algorithm (3 Ranked Options)
  const computeRouteOptions = (
    originHubId: string,
    destHubId: string,
    weightKg: number,
    mailClass: MailClass
  ): RouteOption[] => {
    const originHub = hubs.find((h) => h.id === originHubId);
    const destHub = hubs.find((h) => h.id === destHubId);

    // Filter usable legs (not blocked/cancelled)
    const activeLegs = legs.filter((l) => l.status !== 'CANCELLED' && l.status !== 'BLOCKED');

    // Find direct or 2-hop connected legs
    const directLeg = activeLegs.find((l) => l.originHubId === originHubId && l.destHubId === destHubId);

    const connectingLegs1 = activeLegs.filter((l) => l.originHubId === originHubId);
    let path2: TransportLeg[] = [];
    for (const leg1 of connectingLegs1) {
      const leg2 = activeLegs.find((l) => l.originHubId === leg1.destHubId && l.destHubId === destHubId);
      if (leg2) {
        path2 = [leg1, leg2];
        break;
      }
    }

    // Fallback default legs if direct not available
    const legAir = directLeg && directLeg.mode === 'COMMERCIAL_AIR' 
      ? directLeg 
      : activeLegs.find((l) => l.mode === 'COMMERCIAL_AIR') || activeLegs[0];

    const legRail = path2.length > 0 
      ? path2 
      : [activeLegs.find((l) => l.mode === 'RMS_RAIL') || activeLegs[1] || activeLegs[0]];

    const legRoad = [activeLegs.find((l) => l.mode === 'MMS_ROAD') || activeLegs[0]];

    // Option 1: Fastest Multimodal (Air Priority)
    const opt1Legs = directLeg ? [directLeg] : (path2.length > 0 ? path2 : [legAir]);
    const opt1Duration = opt1Legs.reduce((acc, l) => acc + l.durationHours, 0) + (opt1Legs.length > 1 ? 2.5 : 0);
    const opt1Cost = opt1Legs.reduce((acc, l) => acc + l.costPerKg * weightKg, 0);
    const opt1Dist = opt1Legs.reduce((acc, l) => acc + l.distanceKm, 0);
    const opt1Reliability = opt1Legs.reduce((acc, l) => acc * l.ewmaReliability, 1.0);

    // Option 2: Highest Reliability (Rail/Road Stable Corridor)
    const opt2Legs = path2.length > 0 ? path2 : legRoad;
    const opt2Duration = opt2Legs.reduce((acc, l) => acc + l.durationHours, 0) + 1.5;
    const opt2Cost = opt2Legs.reduce((acc, l) => acc + l.costPerKg * weightKg, 0);
    const opt2Dist = opt2Legs.reduce((acc, l) => acc + l.distanceKm, 0);
    const opt2Reliability = 0.96; // High EWMA reliability score

    // Option 3: Cost-Optimal (Surface/MMS)
    const opt3Legs = legRoad;
    const opt3Duration = opt3Legs.reduce((acc, l) => acc + l.durationHours, 0) + 3.0;
    const opt3Cost = opt3Legs.reduce((acc, l) => acc + l.costPerKg * weightKg, 0) * 0.75;
    const opt3Dist = opt3Legs.reduce((acc, l) => acc + l.distanceKm, 0);
    const opt3Reliability = 0.92;

    const rationale1 = mailClass === 'SPEED_POST'
      ? `Priority Air Cargo selected via ${opt1Legs.map(l => l.carrierName).join(' -> ')}. Meets 24h Speed Post SLA policy. Space capacity verified (${opt1Legs[0]?.availableCapacityKg || 500}kg free).`
      : `Multimodal Air link chosen for rapid dispatch. Higher cost per kg offset by 18-hour time saving.`;

    const rationale2 = `High-stability RMS Rail corridor via ${opt2Legs.map(l => l.carrierName).join(' -> ')}. EWMA historical punctuality score of ${(opt2Reliability * 100).toFixed(1)}%. Low weather disruption risk.`;

    const rationale3 = `Dedicated Departmental Mail Motor Service (MMS Road) fleet. Lowest total cost (₹${opt3Cost.toFixed(0)}), optimal for heavy bulk articles (${weightKg}kg).`;

    return [
      {
        id: 'opt-1',
        rank: 1,
        title: 'Option 1: Fastest Multimodal (Air Priority)',
        totalDurationHours: Number(opt1Duration.toFixed(1)),
        totalCost: Number(opt1Cost.toFixed(2)),
        totalDistanceKm: opt1Dist,
        compositeReliability: Number(opt1Reliability.toFixed(2)),
        legs: opt1Legs,
        rationale: rationale1,
        spaceReserved: false
      },
      {
        id: 'opt-2',
        rank: 2,
        title: 'Option 2: Highest EWMA Reliability (RMS Rail)',
        totalDurationHours: Number(opt2Duration.toFixed(1)),
        totalCost: Number(opt2Cost.toFixed(2)),
        totalDistanceKm: opt2Dist,
        compositeReliability: Number(opt2Reliability.toFixed(2)),
        legs: opt2Legs,
        rationale: rationale2,
        spaceReserved: false
      },
      {
        id: 'opt-3',
        rank: 3,
        title: 'Option 3: Cost-Optimal (Departmental MMS Road)',
        totalDurationHours: Number(opt3Duration.toFixed(1)),
        totalCost: Number(opt3Cost.toFixed(2)),
        totalDistanceKm: opt3Dist,
        compositeReliability: Number(opt3Reliability.toFixed(2)),
        legs: opt3Legs,
        rationale: rationale3,
        spaceReserved: false
      }
    ];
  };

  // Induct new consignment
  const inductConsignment = (
    data: Omit<Consignment, 'id' | 'trackingNumber' | 'status' | 'elapsedHours' | 'timeline' | 'isDelayedRisk'>,
    chosenRoute: RouteOption
  ): Consignment => {
    const prefix = data.mailClass === 'SPEED_POST' ? 'SP' : data.mailClass === 'BUSINESS_PARCEL' ? 'BP' : 'RP';
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    const trackingNumber = `${prefix}${randomDigits}IN`;

    const originHub = hubs.find((h) => h.id === data.originHubId);

    const etaDate = new Date(simulationTime.getTime() + chosenRoute.totalDurationHours * 3600000);
    const etaStr = etaDate.toISOString().replace('T', ' ').substring(0, 16);

    const newConsignment: Consignment = {
      ...data,
      id: `con-${Date.now()}`,
      trackingNumber,
      status: 'INDUCTED',
      elapsedHours: 0,
      originalEta: etaStr,
      currentEta: etaStr,
      isDelayedRisk: false,
      assignedRouteLegIds: chosenRoute.legs.map((l) => l.id),
      timeline: [
        {
          id: `t-${Date.now()}`,
          timestamp: simulationTime.toISOString().replace('T', ' ').substring(0, 16),
          hubId: data.originHubId,
          hubName: originHub?.name || 'Origin Hub',
          statusText: `Inducted into MailFlow (${data.mailClass.replace('_', ' ')}). ${chosenRoute.title} reserved.`,
          location: originHub?.name || 'Origin Sorting Deck'
        }
      ]
    };

    setConsignments((prev) => [newConsignment, ...prev]);
    addAuditLog('CONSIGNMENT_INDUCTED', `Parcel ${trackingNumber} (${data.weightKg}kg, ${data.mailClass}) inducted into network. Space reserved on ${chosenRoute.legs.length} legs.`);

    return newConsignment;
  };

  // Toggle Disruption & update leg statuses
  const toggleDisruption = (disruptionId: string) => {
    setDisruptions((prev) =>
      prev.map((d) => {
        if (d.id === disruptionId) {
          const nextState = !d.active;
          
          // Update affected legs status
          setLegs((prevLegs) =>
            prevLegs.map((l) => {
              if (d.affectedLegIds.includes(l.id)) {
                return {
                  ...l,
                  status: nextState ? (d.type === 'AIR_CANCELLATION' ? 'CANCELLED' : 'BLOCKED') : 'ACTIVE'
                };
              }
              return l;
            })
          );

          addAuditLog(
            nextState ? 'DISRUPTION_ACTIVATED' : 'DISRUPTION_RESOLVED',
            `Disruption "${d.title}" state changed to ${nextState ? 'ACTIVE' : 'RESOLVED'}.`
          );

          return { ...d, active: nextState };
        }
        return d;
      })
    );
  };

  const addDisruption = (disruptionData: Omit<Disruption, 'id'>) => {
    const newDisruption: Disruption = {
      ...disruptionData,
      id: `disruption-${Date.now()}`
    };

    setDisruptions((prev) => [newDisruption, ...prev]);

    // Set legs to blocked
    setLegs((prevLegs) =>
      prevLegs.map((l) => {
        if (disruptionData.affectedLegIds.includes(l.id)) {
          return {
            ...l,
            status: disruptionData.type === 'AIR_CANCELLATION' ? 'CANCELLED' : 'BLOCKED'
          };
        }
        return l;
      })
    );

    addAuditLog(
      'DISRUPTION_CREATED',
      `New live disruption added: ${disruptionData.title} affecting ${disruptionData.affectedLegIds.length} transport legs.`
    );
  };

  // Calculate Blast Radius
  const calculateBlastRadius = (disruptionId: string): BlastRadiusResult | null => {
    const disruption = disruptions.find((d) => d.id === disruptionId);
    if (!disruption) return null;

    // Find all consignments that have assigned legs matching affectedLegIds
    const affected = consignments.filter((c) =>
      c.assignedRouteLegIds.some((legId) => disruption.affectedLegIds.includes(legId)) &&
      c.status !== 'DELIVERED'
    );

    const proposals: RerouteProposal[] = affected.map((c) => {
      const originHub = hubs.find((h) => h.id === c.currentHubId || h.id === c.originHubId);
      const destHub = hubs.find((h) => h.id === c.destHubId);

      const altOptions = computeRouteOptions(
        c.currentHubId || c.originHubId,
        c.destHubId,
        c.weightKg,
        c.mailClass
      );

      const bestAlt = altOptions[0];
      const deltaEta = Math.max(3.5, bestAlt.totalDurationHours - 4.0);

      return {
        consignmentId: c.id,
        trackingNumber: c.trackingNumber,
        currentLocation: originHub?.name || 'In Transit Hub',
        destination: destHub?.name || 'Destination Hub',
        mailClass: c.mailClass,
        originalRouteLegIds: c.assignedRouteLegIds,
        newRouteOption: bestAlt,
        deltaEtaHours: Number(deltaEta.toFixed(1))
      };
    });

    return {
      disruptionId: disruption.id,
      disruptionTitle: disruption.title,
      totalConsignmentsAffected: affected.length,
      avgAddedDelayHours: affected.length > 0 ? 5.2 : 0,
      proposals
    };
  };

  // Execute Bulk Re-route
  const executeBulkReroute = (result: BlastRadiusResult) => {
    setConsignments((prev) =>
      prev.map((c) => {
        const proposal = result.proposals.find((p) => p.consignmentId === c.id);
        if (proposal) {
          const newEtaDate = new Date(simulationTime.getTime() + (c.targetSlaHours + proposal.deltaEtaHours) * 3600000);
          const newEtaStr = newEtaDate.toISOString().replace('T', ' ').substring(0, 16);

          return {
            ...c,
            status: 'REROUTED',
            isDelayedRisk: true,
            delayReason: `Dynamic Re-route applied due to ${result.disruptionTitle}. Rerouted via ${proposal.newRouteOption.title}.`,
            currentEta: newEtaStr,
            assignedRouteLegIds: proposal.newRouteOption.legs.map((l) => l.id),
            timeline: [
              {
                id: `t-${Date.now()}`,
                timestamp: simulationTime.toISOString().replace('T', ' ').substring(0, 16),
                hubId: c.currentHubId,
                hubName: 'Control Tower Blast-Radius Engine',
                statusText: `AUTOMATED BLAST-RADIUS RE-ROUTE: Switched leg from disrupted carrier to ${proposal.newRouteOption.legs.map(l => l.carrierName).join(', ')}. Revised ETA: ${newEtaStr}. Proactive alert sent to customer.`,
                location: 'MailFlow Decision Engine'
              },
              ...c.timeline
            ]
          };
        }
        return c;
      })
    );

    addAuditLog(
      'BULK_REROUTE_EXECUTED',
      `Blast-Radius Engine re-routed ${result.totalConsignmentsAffected} consignments impacted by ${result.disruptionTitle}. Proactive SMS/Email alerts triggered.`
    );
  };

  const addEmbargoRule = (rule: Omit<EmbargoRule, 'id'>) => {
    const newEmbargo: EmbargoRule = { ...rule, id: `embargo-${Date.now()}` };
    setEmbargos((prev) => [newEmbargo, ...prev]);
    addAuditLog('EMBARGO_ADDED', `New postal embargo declared for ${rule.regionCircle}: ${rule.reason}`);
  };

  const removeEmbargoRule = (id: string) => {
    setEmbargos((prev) => prev.filter((e) => e.id !== id));
    addAuditLog('EMBARGO_REMOVED', `Embargo ${id} lifted by Administrator.`);
  };

  return (
    <MockStoreContext.Provider
      value={{
        hubs,
        legs,
        consignments,
        disruptions,
        embargos,
        auditLogs,
        simulationTime,
        isClockRunning,
        activeView,
        userRole,
        demoMode,
        setActiveView,
        setUserRole,
        toggleClock,
        toggleDemoMode,
        computeRouteOptions,
        inductConsignment,
        toggleDisruption,
        addDisruption,
        calculateBlastRadius,
        executeBulkReroute,
        addEmbargoRule,
        removeEmbargoRule
      }}
    >
      {children}
    </MockStoreContext.Provider>
  );
};

export const useMockStore = () => {
  const context = useContext(MockStoreContext);
  if (!context) {
    throw new Error('useMockStore must be used within a MockStoreProvider');
  }
  return context;
};
