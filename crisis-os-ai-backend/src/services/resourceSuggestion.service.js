const earthRadiusKm = 6371;

const resourcePreferenceByIncidentType = {
  fire: [
    {
      label: "Primary fire response",
      maxDistanceKm: 80,
      types: ["fire_truck"]
    },
    {
      label: "Nearby rescue fallback",
      maxDistanceKm: 40,
      types: ["rescue_team"]
    },
    {
      label: "Nearby medical standby fallback",
      maxDistanceKm: 25,
      types: ["ambulance"]
    }
  ],
  medical: [
    {
      label: "Primary medical response",
      maxDistanceKm: 60,
      types: ["ambulance"]
    },
    {
      label: "Nearby rescue fallback",
      maxDistanceKm: 35,
      types: ["rescue_team"]
    }
  ],
  accident: [
    {
      label: "Primary medical response",
      maxDistanceKm: 60,
      types: ["ambulance"]
    },
    {
      label: "Rescue/fire support",
      maxDistanceKm: 45,
      types: ["rescue_team", "fire_truck"]
    }
  ],
  flood: [
    {
      label: "Primary rescue response",
      maxDistanceKm: 80,
      types: ["rescue_team"]
    },
    {
      label: "Medical evacuation support",
      maxDistanceKm: 60,
      types: ["ambulance"]
    }
  ],
  drowning: [
    {
      label: "Primary rescue response",
      maxDistanceKm: 80,
      types: ["rescue_team"]
    },
    {
      label: "Medical evacuation support",
      maxDistanceKm: 60,
      types: ["ambulance"]
    }
  ],
  building_collapse: [
    {
      label: "Primary rescue response",
      maxDistanceKm: 80,
      types: ["rescue_team"]
    },
    {
      label: "Fire and extraction support",
      maxDistanceKm: 60,
      types: ["fire_truck"]
    },
    {
      label: "Medical standby fallback",
      maxDistanceKm: 60,
      types: ["ambulance"]
    }
  ],
  other: [
    {
      label: "Nearest available response",
      maxDistanceKm: 60,
      types: ["rescue_team", "ambulance", "fire_truck"]
    }
  ]
};

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function normalizeIncidentType(value) {
  return typeof value === "string" && resourcePreferenceByIncidentType[value]
    ? value
    : "other";
}

function withDispatchMetadata(resource, preference, rank) {
  return {
    ...resource,
    dispatchPriority: rank + 1,
    dispatchReason: preference.label,
    isFallbackResource: rank > 0,
    requiredTypes: preference.types
  };
}

export function calculateDistanceKm(origin, destination) {
  const latDistance = toRadians(destination.lat - origin.lat);
  const lngDistance = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);

  const straightLineKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Apply a 1.3x road circuity factor to approximate real-world driving distance
  const roadDetourFactor = Number(process.env.ROAD_DETOUR_FACTOR || 1.3);
  return straightLineKm * roadDetourFactor;
}

export function rankResourcesByDistance(origin, resources) {
  const averageEmergencySpeedKmh = 45; // average urban emergency response speed

  return resources
    .map((resource) => {
      const distanceKm = Number(
        calculateDistanceKm(origin, {
          lat: resource.lat,
          lng: resource.lng
        }).toFixed(2)
      );
      const etaMinutes = Math.max(2, Math.ceil((distanceKm / averageEmergencySpeedKmh) * 60));

      return {
        ...resource,
        distanceKm,
        etaMinutes
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function rankResourcesForIncident(incident, resources) {
  if (
    typeof incident?.lat !== "number" ||
    typeof incident?.lng !== "number"
  ) {
    return [];
  }

  const origin = {
    lat: incident.lat,
    lng: incident.lng
  };
  const rankedResources = rankResourcesByDistance(origin, resources);
  const preferences = resourcePreferenceByIncidentType[normalizeIncidentType(incident.type)];

  for (const [rank, preference] of preferences.entries()) {
    const match = rankedResources.find(
      (resource) =>
        preference.types.includes(resource.type) &&
        resource.distanceKm <= preference.maxDistanceKm
    );

    if (match) {
      return [withDispatchMetadata(match, preference, rank)];
    }
  }

  const nearestPreferred = rankedResources.find((resource) =>
    preferences.some((preference) => preference.types.includes(resource.type))
  );

  if (nearestPreferred) {
    return [
      {
        ...withDispatchMetadata(nearestPreferred, preferences[0], 0),
        dispatchReason: "Nearest preferred unit is outside normal response radius.",
        requiresSupervisorReview: true
      }
    ];
  }

  return rankedResources.slice(0, 1).map((resource) => ({
    ...resource,
    dispatchPriority: preferences.length + 1,
    dispatchReason: "No preferred resource type is available; nearest available fallback shown.",
    isFallbackResource: true,
    requiresSupervisorReview: true,
    requiredTypes: preferences.flatMap((preference) => preference.types)
  }));
}

export async function findNearestAvailableResource(prisma, incident) {
  if (
    typeof incident?.lat !== "number" ||
    typeof incident?.lng !== "number"
  ) {
    return null;
  }

  const availableResources = await prisma.resource.findMany({
    where: {
      status: "available"
    }
  });

  return rankResourcesForIncident(incident, availableResources)[0] || null;
}