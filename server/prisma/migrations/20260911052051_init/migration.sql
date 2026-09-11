-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "preferredEmployeeId" TEXT,
    "preferredEmployeeName" TEXT,
    "earliestDate" DATETIME NOT NULL,
    "latestDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "notifiedAt" DATETIME,
    "eposnowBookingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmployeeSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eposnowStaffId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#6C63FF',
    "workingHours" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eposnowBookingId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WhatsappMessageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toPhone" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSchedule_eposnowStaffId_key" ON "EmployeeSchedule"("eposnowStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_eposnowBookingId_reminderType_key" ON "ReminderLog"("eposnowBookingId", "reminderType");
