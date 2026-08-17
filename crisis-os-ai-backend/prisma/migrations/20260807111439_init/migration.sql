-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "type" TEXT,
    "severity" TEXT,
    "locationText" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "aiNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "assignedResourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedResourceId_fkey" FOREIGN KEY ("assignedResourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
