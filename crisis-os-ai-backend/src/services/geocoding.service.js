import { resolveLocationFromText } from "./location.service.js";

const defaultNominatimBaseUrl = "https://nominatim.openstreetmap.org/search";
const geocodeCache = new Map();
let nominatimQueue = Promise.resolve();
let lastNominatimRequestAt = 0;

function getCacheTtlMs() {
  const hours = Number(process.env.GEOCODING_CACHE_TTL_HOURS || 168);
  return (Number.isFinite(hours) && hours > 0 ? hours : 168) * 60 * 60 * 1000;
}

function getMinRequestIntervalMs() {
  const requestsPerSecond = Number(process.env.NOMINATIM_MAX_REQUESTS_PER_SECOND || 1);
  const safeRate = Number.isFinite(requestsPerSecond) && requestsPerSecond > 0 ? requestsPerSecond : 1;
  return Math.ceil(1000 / Math.min(safeRate, 1));
}

function normalizeQuery(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function isBroadCityFallback(query, location) {
  if (!location) {
    return false;
  }

  const broadCities = new Set(["Lahore", "Islamabad", "Karachi"]);
  const normalizedQuery = normalizeQuery(query).toLowerCase();
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  return broadCities.has(location.name) && queryTokens.length > 1 && normalizedQuery !== location.name.toLowerCase();
}

function buildPakistanQuery(query) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return "";
  }

  return /\bpakistan\b/i.test(normalized) ? normalized : `${normalized}, Pakistan`;
}

function getCachedResult(cacheKey) {
  const cached = geocodeCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.savedAt > getCacheTtlMs()) {
    geocodeCache.delete(cacheKey);
    return null;
  }

  return cached.value;
}

function setCachedResult(cacheKey, value) {
  geocodeCache.set(cacheKey, {
    savedAt: Date.now(),
    value
  });
}

async function waitForNominatimSlot() {
  const elapsed = Date.now() - lastNominatimRequestAt;
  const delay = Math.max(0, getMinRequestIntervalMs() - elapsed);

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  lastNominatimRequestAt = Date.now();
}

async function runNominatimRequest(task) {
  const run = nominatimQueue.then(async () => {
    await waitForNominatimSlot();
    return task();
  });

  nominatimQueue = run.catch(() => null);
  return run;
}

function getNominatimHeaders() {
  const userAgent =
    process.env.NOMINATIM_USER_AGENT ||
    process.env.OPENROUTER_APP_TITLE ||
    "CrisisOSAI/0.1 (local-development)";
  const headers = {
    "Accept": "application/json",
    "User-Agent": userAgent
  };

  if (process.env.OPENROUTER_HTTP_REFERER) {
    headers.Referer = process.env.OPENROUTER_HTTP_REFERER;
  }

  return headers;
}

function normalizeNominatimPlace(place) {
  const lat = Number(place?.lat);
  const lng = Number(place?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    name: place.display_name || place.name || "Resolved location",
    lat,
    lng,
    source: "nominatim",
    confidence: Number.isFinite(Number(place.importance))
      ? Math.max(0.45, Math.min(0.95, Number(place.importance)))
      : 0.7
  };
}

async function searchNominatim(query) {
  if (process.env.GEOCODING_PROVIDER === "local") {
    return null;
  }

  const pakistanQuery = buildPakistanQuery(query);

  if (!pakistanQuery) {
    return null;
  }

  const cacheKey = pakistanQuery.toLowerCase();
  const cached = getCachedResult(cacheKey);

  if (cached) {
    return cached;
  }

  return runNominatimRequest(async () => {
    const url = new URL(process.env.NOMINATIM_BASE_URL || defaultNominatimBaseUrl);
    url.searchParams.set("q", pakistanQuery);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "pk");
    url.searchParams.set("accept-language", "en");

    try {
      const response = await fetch(url, {
        headers: getNominatimHeaders()
      });

      if (!response.ok) {
        throw new Error(`Nominatim returned ${response.status}.`);
      }

      const places = await response.json();
      const resolved = Array.isArray(places)
        ? normalizeNominatimPlace(places[0])
        : null;

      setCachedResult(cacheKey, resolved);
      return resolved;
    } catch (error) {
      console.error("Geocoding lookup failed:", error);
      setCachedResult(cacheKey, null);
      return null;
    }
  });
}

export async function resolveIncidentLocation({ locationText, rawText }) {
  const directLocation = normalizeQuery(locationText);
  const localLocation = resolveLocationFromText(directLocation);

  if (localLocation && !isBroadCityFallback(directLocation, localLocation)) {
    return {
      ...localLocation,
      source: "local_gazetteer",
      confidence: 0.95
    };
  }

  const geocodedLocation = await searchNominatim(directLocation);

  if (geocodedLocation) {
    return geocodedLocation;
  }

  if (localLocation) {
    return {
      ...localLocation,
      source: "local_gazetteer",
      confidence: 0.7
    };
  }

  if (process.env.GEOCODING_ALLOW_RAW_TEXT === "true") {
    const rawGeocodedLocation = await searchNominatim(rawText);

    if (rawGeocodedLocation) {
      return rawGeocodedLocation;
    }
  }

  return null;
}

export async function geocodeLocationText(query) {
  const localLocation = resolveLocationFromText(query);

  if (localLocation && !isBroadCityFallback(query, localLocation)) {
    return {
      ...localLocation,
      source: "local_gazetteer",
      confidence: 0.95
    };
  }

  const geocodedLocation = await searchNominatim(query);

  if (geocodedLocation) {
    return geocodedLocation;
  }

  if (localLocation) {
    return {
      ...localLocation,
      source: "local_gazetteer",
      confidence: 0.7
    };
  }

  return null;
}