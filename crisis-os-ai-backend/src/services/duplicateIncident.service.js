import { calculateDistanceKm } from "./resourceSuggestion.service.js";

const activeStatuses = new Set(["new", "needs_review", "assigned", "en_route", "on_scene"]);
const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "building",
  "for",
  "from",
  "in",
  "inside",
  "near",
  "of",
  "on",
  "reported",
  "reports",
  "the",
  "to",
  "visible",
  "with"
]);

function getLookbackMs() {
  const hours = Number(process.env.DUPLICATE_LOOKBACK_HOURS || 12);
  return (Number.isFinite(hours) && hours > 0 ? hours : 12) * 60 * 60 * 1000;
}

function getDistanceThresholdKm() {
  const threshold = Number(process.env.DUPLICATE_DISTANCE_KM || 2.5);
  return Number.isFinite(threshold) && threshold > 0 ? threshold : 2.5;
}

function tokenize(value) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function jaccardSimilarity(leftValue, rightValue) {
  const left = new Set(tokenize(leftValue));
  const right = new Set(tokenize(rightValue));

  if (!left.size || !right.size) {
    return 0;
  }

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;

  return union ? intersection / union : 0;
}

function hasCoordinates(incident) {
  return typeof incident?.lat === "number" && typeof incident?.lng === "number";
}

function getDistanceKm(left, right) {
  if (!hasCoordinates(left) || !hasCoordinates(right)) {
    return null;
  }

  return Number(
    calculateDistanceKm(
      { lat: left.lat, lng: left.lng },
      { lat: right.lat, lng: right.lng }
    ).toFixed(2)
  );
}

function isComparableType(left, right) {
  return left.type === right.type || left.type === "other" || right.type === "other";
}

function normalizeCreatedAt(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getDuplicateSignal(incident, candidate) {
  if (!candidate || incident.id === candidate.id || !activeStatuses.has(candidate.status)) {
    return null;
  }

  const ageDifferenceMs = Math.abs(
    normalizeCreatedAt(incident.createdAt).getTime() - normalizeCreatedAt(candidate.createdAt).getTime()
  );

  if (ageDifferenceMs > getLookbackMs()) {
    return null;
  }

  const distanceKm = getDistanceKm(incident, candidate);
  const maxDistanceKm = getDistanceThresholdKm();
  const textScore = jaccardSimilarity(
    `${incident.rawText || ""} ${incident.locationText || ""}`,
    `${candidate.rawText || ""} ${candidate.locationText || ""}`
  );
  const typeScore = isComparableType(incident, candidate) ? 1 : 0;
  const distanceScore = distanceKm === null ? 0 : Math.max(0, 1 - distanceKm / maxDistanceKm);
  const sameArea = distanceKm !== null && distanceKm <= maxDistanceKm;
  const strongTextMatch = textScore >= 0.45;

  if (!typeScore || (!sameArea && !strongTextMatch)) {
    return null;
  }

  const duplicateScore = Number(
    Math.min(0.99, typeScore * 0.45 + distanceScore * 0.4 + textScore * 0.25).toFixed(2)
  );

  if (duplicateScore < 0.55) {
    return null;
  }

  return {
    id: candidate.id,
    rawText: candidate.rawText,
    type: candidate.type,
    severity: candidate.severity,
    locationText: candidate.locationText,
    status: candidate.status,
    createdAt: candidate.createdAt,
    distanceKm,
    duplicateScore,
    reason: sameArea
      ? "Same incident type near the same location."
      : "Similar report text within the duplicate lookback window."
  };
}

export function getPossibleDuplicates(incident, candidates, limit = 3) {
  return candidates
    .map((candidate) => getDuplicateSignal(incident, candidate))
    .filter(Boolean)
    .sort((a, b) => b.duplicateScore - a.duplicateScore)
    .slice(0, limit);
}

export function attachDuplicateSignals(incidents) {
  return incidents.map((incident) => ({
    ...incident,
    possibleDuplicates: getPossibleDuplicates(incident, incidents)
  }));
}

export async function findPossibleDuplicateIncidents(prisma, incident) {
  const since = new Date(Date.now() - getLookbackMs());
  const candidates = await prisma.incident.findMany({
    where: {
      id: {
        not: incident.id
      },
      status: {
        in: [...activeStatuses]
      },
      createdAt: {
        gte: since
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });

  return getPossibleDuplicates(incident, candidates);
}