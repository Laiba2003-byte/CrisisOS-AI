import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const resources = [
  {
    id: "res-lhr-ambulance-mall-road",
    name: "Ambulance 1122 - Lahore Mall Road",
    type: "ambulance",
    status: "available",
    lat: 31.5656,
    lng: 74.3142
  },
  {
    id: "res-lhr-fire-jinnah-hospital",
    name: "Fire Unit - Lahore Jinnah Hospital",
    type: "fire_truck",
    status: "busy",
    lat: 31.4846,
    lng: 74.2982
  },
  {
    id: "res-lhr-team-shahdara",
    name: "Rescue Team - Shahdara Lahore",
    type: "rescue_team",
    status: "available",
    lat: 31.6228,
    lng: 74.2869
  },
  {
    id: "res-rwp-ambulance-saddar",
    name: "Ambulance 1122 - Rawalpindi Saddar",
    type: "ambulance",
    status: "available",
    lat: 33.595,
    lng: 73.0528
  },
  {
    id: "res-isl-team-f8",
    name: "Rescue Team - Islamabad F-8",
    type: "rescue_team",
    status: "available",
    lat: 33.7111,
    lng: 73.0399
  },
  {
    id: "res-mur-fire-mall-road",
    name: "Fire Unit - Murree Mall Road",
    type: "fire_truck",
    status: "offline",
    lat: 33.907,
    lng: 73.3943
  },
  {
    id: "res-fsd-ambulance-clock-tower",
    name: "Ambulance 1122 - Faisalabad Clock Tower",
    type: "ambulance",
    status: "available",
    lat: 31.418,
    lng: 73.079
  },
  {
    id: "res-mux-team-ghanta-ghar",
    name: "Rescue Team - Multan Ghanta Ghar",
    type: "rescue_team",
    status: "busy",
    lat: 30.1978,
    lng: 71.4697
  },
  {
    id: "res-khi-ambulance-saddar",
    name: "Ambulance - Karachi Saddar",
    type: "ambulance",
    status: "available",
    lat: 24.8615,
    lng: 67.0099
  },
  {
    id: "res-khi-fire-clifton",
    name: "Fire Unit - Karachi Clifton",
    type: "fire_truck",
    status: "available",
    lat: 24.8138,
    lng: 67.0299
  },
  {
    id: "res-hyd-team-latifeabad",
    name: "Rescue Team - Hyderabad Latifabad",
    type: "rescue_team",
    status: "available",
    lat: 25.3864,
    lng: 68.3388
  },
  {
    id: "res-suk-ambulance-barrage",
    name: "Ambulance - Sukkur Barrage",
    type: "ambulance",
    status: "busy",
    lat: 27.6924,
    lng: 68.8951
  },
  {
    id: "res-psh-ambulance-university-road",
    name: "Ambulance - Peshawar University Road",
    type: "ambulance",
    status: "available",
    lat: 34.0015,
    lng: 71.4859
  },
  {
    id: "res-swat-team-mingora",
    name: "Rescue Team - Mingora Swat",
    type: "rescue_team",
    status: "available",
    lat: 34.7717,
    lng: 72.3602
  },
  {
    id: "res-qta-fire-jinnah-road",
    name: "Fire Unit - Quetta Jinnah Road",
    type: "fire_truck",
    status: "available",
    lat: 30.1956,
    lng: 67.0177
  },
  {
    id: "res-gwd-team-port",
    name: "Rescue Team - Gwadar Port",
    type: "rescue_team",
    status: "offline",
    lat: 25.1216,
    lng: 62.3254
  },
  {
    id: "res-mzd-ambulance-domel",
    name: "Ambulance - Muzaffarabad Domel",
    type: "ambulance",
    status: "available",
    lat: 34.3706,
    lng: 73.4708
  },
  {
    id: "res-bwp-fire-model-town",
    name: "Fire Unit - Bahawalpur Model Town",
    type: "fire_truck",
    status: "available",
    lat: 29.3956,
    lng: 71.6836
  }
];

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required. Create server/.env from server/.env.example before running the seed."
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = createPrismaClient();

  try {
    await Promise.all(
      resources.map((resource) =>
        prisma.resource.upsert({
          where: { id: resource.id },
          update: {
            name: resource.name,
            type: resource.type,
            status: resource.status,
            lat: resource.lat,
            lng: resource.lng
          },
          create: resource
        })
      )
    );

    console.log(`Seeded ${resources.length} simulated resources across Pakistan.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
