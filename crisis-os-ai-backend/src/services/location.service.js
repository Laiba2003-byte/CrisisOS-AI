const knownLocations = [
  {
    name: "Liberty Market Lahore",
    lat: 31.5102,
    lng: 74.3441,
    aliases: ["liberty market lahore", "liberty market", "liberty gulberg"]
  },
  {
    name: "Gulberg Lahore",
    lat: 31.5119,
    lng: 74.3467,
    aliases: ["gulberg lahore", "gulberg"]
  },
  {
    name: "Kalma Chowk Lahore",
    lat: 31.5049,
    lng: 74.3326,
    aliases: ["kalma chowk lahore", "kalma chowk", "model town kalma chowk"]
  },  {
    name: "Lahore Mall Road",
    lat: 31.5656,
    lng: 74.3142,
    aliases: ["mall road lahore", "lahore mall road"]
  },
  {
    name: "Jinnah Hospital Lahore",
    lat: 31.4846,
    lng: 74.2982,
    aliases: ["jinnah hospital lahore", "jinnah hospital"]
  },
  {
    name: "Shahdara Lahore",
    lat: 31.6228,
    lng: 74.2869,
    aliases: ["shahdara lahore", "shahdara"]
  },
  {
    name: "Rawalpindi Saddar",
    lat: 33.595,
    lng: 73.0528,
    aliases: ["rawalpindi saddar", "saddar rawalpindi", "pindi saddar"]
  },
  {
    name: "Islamabad F-8",
    lat: 33.7111,
    lng: 73.0399,
    aliases: ["islamabad f-8", "f-8 islamabad", "f8 islamabad", "f 8 islamabad", "f-8", "f 8"]
  },
  {
    name: "Murree Mall Road",
    lat: 33.907,
    lng: 73.3943,
    aliases: ["murree mall road", "mall road murree", "murree"]
  },
  {
    name: "Faisalabad Clock Tower",
    lat: 31.418,
    lng: 73.079,
    aliases: ["faisalabad clock tower", "clock tower faisalabad", "faisalabad"]
  },
  {
    name: "Multan Ghanta Ghar",
    lat: 30.1978,
    lng: 71.4697,
    aliases: ["multan ghanta ghar", "ghanta ghar multan", "multan"]
  },
  {
    name: "Karachi Saddar",
    lat: 24.8615,
    lng: 67.0099,
    aliases: ["karachi saddar", "saddar karachi"]
  },
  {
    name: "Karachi Clifton",
    lat: 24.8138,
    lng: 67.0299,
    aliases: ["karachi clifton", "clifton karachi", "clifton"]
  },
  {
    name: "Hyderabad Latifabad",
    lat: 25.3864,
    lng: 68.3388,
    aliases: ["hyderabad latifabad", "latifabad hyderabad", "latifabad"]
  },
  {
    name: "Sukkur Barrage",
    lat: 27.6924,
    lng: 68.8951,
    aliases: ["sukkur barrage", "sukkur"]
  },
  {
    name: "Peshawar University Road",
    lat: 34.0015,
    lng: 71.4859,
    aliases: ["peshawar university road", "university road peshawar", "peshawar"]
  },
  {
    name: "Mingora Swat",
    lat: 34.7717,
    lng: 72.3602,
    aliases: ["mingora swat", "mingora", "swat"]
  },
  {
    name: "Quetta Jinnah Road",
    lat: 30.1956,
    lng: 67.0177,
    aliases: ["quetta jinnah road", "jinnah road quetta", "quetta"]
  },
  {
    name: "Gwadar Port",
    lat: 25.1216,
    lng: 62.3254,
    aliases: ["gwadar port", "gwadar"]
  },
  {
    name: "Muzaffarabad Domel",
    lat: 34.3706,
    lng: 73.4708,
    aliases: ["muzaffarabad domel", "domel muzaffarabad", "muzaffarabad"]
  },
  {
    name: "Bahawalpur Model Town",
    lat: 29.3956,
    lng: 71.6836,
    aliases: ["bahawalpur model town", "model town bahawalpur", "bahawalpur"]
  },
  {
    name: "Lahore",
    lat: 31.5204,
    lng: 74.3587,
    aliases: ["lahore"]
  },
  {
    name: "Islamabad",
    lat: 33.6844,
    lng: 73.0479,
    aliases: ["islamabad"]
  },
  {
    name: "Karachi",
    lat: 24.8607,
    lng: 67.0011,
    aliases: ["karachi"]
  }
];

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export function resolveLocationFromText(locationText) {
  if (!locationText) {
    return null;
  }

  const normalizedLocation = normalizeText(locationText);
  const matches = knownLocations
    .flatMap((location) =>
      location.aliases.map((alias) => ({
        ...location,
        alias
      }))
    )
    .filter(({ alias }) => normalizedLocation.includes(normalizeText(alias)))
    .sort((a, b) => b.alias.length - a.alias.length);

  const match = matches[0];

  if (!match) {
    return null;
  }

  return {
    name: match.name,
    lat: match.lat,
    lng: match.lng
  };
}
