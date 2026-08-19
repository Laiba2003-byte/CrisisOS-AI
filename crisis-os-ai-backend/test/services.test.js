import assert from "node:assert/strict";
import test from "node:test";
import { getPossibleDuplicates } from "../src/services/duplicateIncident.service.js";
import { resolveLocationFromText } from "../src/services/location.service.js";
import {
  calculateDistanceKm,
  rankResourcesForIncident
} from "../src/services/resourceSuggestion.service.js";

test("calculateDistanceKm returns zero for the same coordinates", () => {
  assert.equal(
    calculateDistanceKm({ lat: 31.52, lng: 74.35 }, { lat: 31.52, lng: 74.35 }),
    0
  );
});

test("rankResourcesForIncident prefers an available fire unit for a fire", () => {
  const resources = [
    {
      id: "ambulance-nearby",
      name: "Nearby ambulance",
      type: "ambulance",
      status: "available",
      lat: 31.521,
      lng: 74.351
    },
    {
      id: "fire-unit-nearby",
      name: "Nearby fire unit",
      type: "fire_truck",
      status: "available",
      lat: 31.522,
      lng: 74.352
    }
  ];

  const [suggestion] = rankResourcesForIncident(
    { type: "fire", lat: 31.52, lng: 74.35 },
    resources
  );

  assert.equal(suggestion.id, "fire-unit-nearby");
  assert.equal(suggestion.dispatchPriority, 1);
  assert.equal(suggestion.isFallbackResource, false);
});

test("getPossibleDuplicates finds a nearby active incident with matching text", () => {
  const incident = {
    id: "incident-primary",
    rawText: "Fire reported near Mall Road Lahore with people trapped",
    type: "fire",
    severity: "critical",
    locationText: "Lahore Mall Road",
    lat: 31.5656,
    lng: 74.3142,
    status: "new",
    createdAt: new Date().toISOString()
  };
  const duplicate = {
    id: "incident-duplicate",
    rawText: "Fire reported near Mall Road Lahore, people trapped inside",
    type: "fire",
    severity: "high",
    locationText: "Lahore Mall Road",
    lat: 31.5657,
    lng: 74.3143,
    status: "needs_review",
    createdAt: new Date().toISOString()
  };

  const matches = getPossibleDuplicates(incident, [duplicate]);

  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, duplicate.id);
  assert.equal(matches[0].reason, "Same incident type near the same location.");
});

test("getPossibleDuplicates ignores resolved incidents", () => {
  const incident = {
    id: "incident-primary",
    rawText: "Medical emergency at Liberty Market Lahore",
    type: "medical",
    locationText: "Liberty Market Lahore",
    lat: 31.5102,
    lng: 74.3441,
    status: "new",
    createdAt: new Date().toISOString()
  };
  const resolvedIncident = {
    ...incident,
    id: "incident-resolved",
    status: "resolved"
  };

  assert.deepEqual(getPossibleDuplicates(incident, [resolvedIncident]), []);
});

test("resolveLocationFromText resolves known location aliases", () => {
  assert.deepEqual(resolveLocationFromText("Emergency near Liberty Market"), {
    name: "Liberty Market Lahore",
    lat: 31.5102,
    lng: 74.3441
  });
});
