-- Drop the incorrect tables if they exist
DROP TABLE IF EXISTS "PendingRegistration";
DROP TABLE IF EXISTS "PendingRegistrations";
DROP TABLE IF EXISTS pendingregistration;

-- Create the correct PendingRegistrations table with exact column names expected by the backend
CREATE TABLE "PendingRegistrations" (
    "tempId" VARCHAR(255) PRIMARY KEY,
    "fullName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phoneNo" VARCHAR(20) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "nationalId" VARCHAR(50) NOT NULL,
    "studentId" INTEGER NOT NULL,
    "studentName" VARCHAR(100) NOT NULL,
    "relationshipType" VARCHAR(20) NOT NULL,
    "otpVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure email, phoneNo, and nationalId are unique to prevent duplicates
ALTER TABLE "PendingRegistrations" ADD CONSTRAINT unique_email UNIQUE ("email");
ALTER TABLE "PendingRegistrations" ADD CONSTRAINT unique_phoneNo UNIQUE ("phoneNo");
ALTER TABLE "PendingRegistrations" ADD CONSTRAINT unique_nationalId UNIQUE ("nationalId");
