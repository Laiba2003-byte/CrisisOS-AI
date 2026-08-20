import { getPrisma } from "../lib/prisma.js";
import { broadcastEvent } from "../lib/events.js";

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

export async function listShelters(_req, res) {
  const prisma = getPrisma();
  const shelters = await prisma.shelter.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }]
  });

  res.json(shelters);
}

export async function getShelterById(req, res) {
  const prisma = getPrisma();
  const shelter = await prisma.shelter.findUnique({
    where: { id: req.params.id }
  });

  if (!shelter) {
    throw createHttpError(404, "Shelter not found.");
  }

  res.json(shelter);
}

export async function createShelter(req, res) {
  const { name, locationText, lat, lng, capacity, occupancy, status, contactPhone } = req.body;
  const prisma = getPrisma();

  const shelter = await prisma.shelter.create({
    data: {
      name,
      locationText,
      lat,
      lng,
      capacity,
      occupancy: occupancy || 0,
      status: status || "active",
      contactPhone: contactPhone || null
    }
  });

  broadcastEvent("shelter_updated", shelter);
  res.status(201).json(shelter);
}

export async function updateShelter(req, res) {
  const prisma = getPrisma();
  const existingShelter = await prisma.shelter.findUnique({
    where: { id: req.params.id }
  });

  if (!existingShelter) {
    throw createHttpError(404, "Shelter not found.");
  }

  const data = {};
  const { name, locationText, lat, lng, capacity, occupancy, status, contactPhone } = req.body;

  if (name !== undefined) data.name = name;
  if (locationText !== undefined) data.locationText = locationText;
  if (lat !== undefined) data.lat = lat;
  if (lng !== undefined) data.lng = lng;
  if (capacity !== undefined) data.capacity = capacity;
  if (occupancy !== undefined) data.occupancy = occupancy;
  if (status !== undefined) data.status = status;
  if (contactPhone !== undefined) data.contactPhone = contactPhone;

  // Automatically mark full if occupancy >= capacity
  if (data.capacity !== undefined || data.occupancy !== undefined) {
    const finalCapacity = data.capacity ?? existingShelter.capacity;
    const finalOccupancy = data.occupancy ?? existingShelter.occupancy;
    if (finalOccupancy >= finalCapacity) {
      data.status = "full";
    } else if (existingShelter.status === "full" && finalOccupancy < finalCapacity) {
      data.status = "active";
    }
  }

  const updatedShelter = await prisma.shelter.update({
    where: { id: req.params.id },
    data
  });

  broadcastEvent("shelter_updated", updatedShelter);
  res.json(updatedShelter);
}
