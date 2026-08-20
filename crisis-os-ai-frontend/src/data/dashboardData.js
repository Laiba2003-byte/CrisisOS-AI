export const fallbackIncidents = [
  {
    id: "demo-flood-shahdara",
    rawText: "Flood warning near Ravi River, Shahdara",
    type: "flood",
    severity: "critical",
    locationText: "Ravi River, Shahdara",
    lat: 31.6228,
    lng: 74.2869,
    confidence: 0.91,
    aiNotes: "Water level rising near residential access roads.",
    status: "new",
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    suggestedResource: { name: "Rescue Team - Shahdara Lahore", distanceKm: 0.2 }
  },
  {
    id: "demo-rain-gulberg",
    rawText: "Heavy rainfall causing road flooding in Gulberg Lahore",
    type: "flood",
    severity: "high",
    locationText: "Gulberg, Lahore",
    lat: 31.5119,
    lng: 74.3467,
    confidence: 0.85,
    aiNotes: "Road flooding reported after heavy rainfall.",
    status: "assigned",
    createdAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    assignedResource: { name: "Ambulance 1122 - Lahore Mall Road" }
  },
  {
    id: "demo-accident-model-town",
    rawText: "Traffic accident at Kalma Chowk near Model Town",
    type: "accident",
    severity: "medium",
    locationText: "Kalma Chowk, Model Town",
    lat: 31.5036,
    lng: 74.3314,
    confidence: 0.78,
    aiNotes: "Multiple vehicles involved near main intersection.",
    status: "en_route",
    createdAt: new Date(Date.now() - 69 * 60 * 1000).toISOString(),
    assignedResource: { name: "Fire Unit - Lahore Jinnah Hospital" }
  },
  {
    id: "demo-collapse-wapda",
    rawText: "Wall collapse reported near Wapda Town",
    type: "building_collapse",
    severity: "high",
    locationText: "Wapda Town Lahore",
    lat: 31.4326,
    lng: 74.2642,
    confidence: 0.82,
    aiNotes: "Possible trapped residents; rescue team required.",
    status: "new",
    createdAt: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
    suggestedResource: { name: "Fire Unit - Lahore Jinnah Hospital", distanceKm: 6.8 }
  },
  {
    id: "demo-medical-ferozepur",
    rawText: "Medical emergency near Ferozepur Road",
    type: "medical",
    severity: "low",
    locationText: "Ferozepur Road Lahore",
    lat: 31.4685,
    lng: 74.3123,
    confidence: 0.72,
    aiNotes: "Patient needs ambulance dispatch.",
    status: "resolved",
    createdAt: new Date(Date.now() - 138 * 60 * 1000).toISOString(),
    assignedResource: { name: "Ambulance 1122 - Lahore Mall Road" }
  }
];

export const fallbackResources = [
  { id: "demo-ambulance-mall-road", name: "Ambulance 1122 - Lahore Mall Road", type: "ambulance", status: "available", lat: 31.5656, lng: 74.3142 },
  { id: "demo-fire-jinnah", name: "Fire Unit - Lahore Jinnah Hospital", type: "fire_truck", status: "busy", lat: 31.4846, lng: 74.2982 },
  { id: "demo-team-shahdara", name: "Rescue Team - Shahdara Lahore", type: "rescue_team", status: "available", lat: 31.6228, lng: 74.2869 },
  { id: "demo-ambulance-rwp", name: "Ambulance 1122 - Rawalpindi Saddar", type: "ambulance", status: "available", lat: 33.595, lng: 73.0528 }
];

export const sampleReports = [
  "Fire reported near Mall Road Lahore, smoke visible from a commercial building.",
  "Traffic accident at Kalma Chowk Model Town, two people injured and ambulance needed.",
  "Flood water rising near Shahdara Lahore after heavy rain, families need evacuation."
];

export const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };

export const severityStyles = {
  critical: { label: "Critical", dot: "bg-red-400", badge: "bg-red-500/15 text-red-200 border-red-500/30", panel: "border-red-500/20 bg-red-500/10", stroke: "#ef4444" },
  high: { label: "High", dot: "bg-amber-400", badge: "bg-amber-500/15 text-amber-200 border-amber-500/30", panel: "border-amber-500/20 bg-amber-500/10", stroke: "#f59e0b" },
  medium: { label: "Moderate", dot: "bg-sky-400", badge: "bg-sky-500/15 text-sky-200 border-sky-500/30", panel: "border-sky-500/20 bg-sky-500/10", stroke: "#38bdf8" },
  low: { label: "Low", dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30", panel: "border-emerald-500/20 bg-emerald-500/10", stroke: "#34d399" }
};

export const statusStyles = {
  new: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  needs_review: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  assigned: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  en_route: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  on_scene: "bg-red-500/15 text-red-200 border-red-500/30",
  resolved: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  merged: "bg-slate-500/15 text-slate-300 border-slate-500/30"
};

export const typeStyles = {
  flood: { label: "Flood Warning", color: "text-red-300", bg: "bg-red-500/15" },
  fire: { label: "Fire Emergency", color: "text-red-300", bg: "bg-red-500/15" },
  medical: { label: "Medical Emergency", color: "text-emerald-300", bg: "bg-emerald-500/15" },
  accident: { label: "Traffic Accident", color: "text-sky-300", bg: "bg-sky-500/15" },
  building_collapse: { label: "Structure Incident", color: "text-amber-300", bg: "bg-amber-500/15" },
  drowning: { label: "Water Rescue", color: "text-sky-300", bg: "bg-sky-500/15" },
  other: { label: "General Alert", color: "text-amber-300", bg: "bg-amber-500/15" }
};

export const trendSeries = [
  { label: "Critical", color: "#ef4444", points: [11, 14, 8, 19, 13, 18, 31] },
  { label: "High", color: "#f59e0b", points: [18, 24, 12, 26, 21, 13, 19] },
  { label: "Moderate", color: "#38bdf8", points: [4, 13, 3, 12, 13, 15, 23] },
  { label: "Low", color: "#34d399", points: [4, 6, 3, 4, 6, 5, 9] }
];

export const fallbackShelters = [
  {
    id: "shelter-lhr-sports-complex",
    name: "Nishtar Park Sports Complex Relief Camp",
    locationText: "Nishtar Park, Gulberg III, Lahore",
    lat: 31.5125,
    lng: 74.3312,
    capacity: 500,
    occupancy: 180,
    status: "active",
    contactPhone: "+92 42 111 222 333"
  },
  {
    id: "shelter-isl-convention-center",
    name: "Islamabad Convention Center Relief Hub",
    locationText: "Club Road, G-5/1, Islamabad",
    lat: 33.7089,
    lng: 73.0924,
    capacity: 800,
    occupancy: 340,
    status: "active",
    contactPhone: "+92 51 920 1122"
  },
  {
    id: "shelter-khi-expocenter",
    name: "Karachi Expo Centre Emergency Shelter",
    locationText: "University Road, Gulshan-e-Iqbal, Karachi",
    lat: 24.9012,
    lng: 67.0876,
    capacity: 1200,
    occupancy: 610,
    status: "active",
    contactPhone: "+92 21 992 0112"
  }
];