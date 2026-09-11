import { Router } from "express";
import { z } from "zod";
import * as eposnow from "../eposnow/client.js";
import { prisma } from "../db/prisma.js";

export const employeesRouter = Router();

// Combina el staff de EposNow (nombre, activo) con los datos que
// EposNow no gestiona pero necesitamos para la agenda: color en el
// calendario y horario de trabajo por día.
employeesRouter.get("/", async (_req, res) => {
  const staff = await eposnow.listStaff();
  const schedules = await prisma.employeeSchedule.findMany();
  const scheduleByStaffId = new Map(schedules.map((s) => [s.eposnowStaffId, s]));

  const employees = staff
    .filter((s) => s.Active)
    .map((s) => {
      const schedule = scheduleByStaffId.get(String(s.Id));
      return {
        id: s.Id,
        name: `${s.FirstName} ${s.LastName}`,
        colorHex: schedule?.colorHex ?? "#6C63FF",
        workingHours: schedule ? JSON.parse(schedule.workingHours) : defaultWorkingHours(),
        hasCustomSchedule: Boolean(schedule),
      };
    });

  res.json(employees);
});

const workingHoursSchema = z.record(
  z.string(),
  z.array(z.tuple([z.string(), z.string()])),
);

const upsertScheduleSchema = z.object({
  displayName: z.string().min(1),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  workingHours: workingHoursSchema,
});

// PUT /api/employees/:staffId/schedule
employeesRouter.put("/:staffId/schedule", async (req, res) => {
  const parsed = upsertScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { staffId } = req.params;
  const schedule = await prisma.employeeSchedule.upsert({
    where: { eposnowStaffId: staffId },
    update: {
      displayName: parsed.data.displayName,
      colorHex: parsed.data.colorHex,
      workingHours: JSON.stringify(parsed.data.workingHours),
    },
    create: {
      eposnowStaffId: staffId,
      displayName: parsed.data.displayName,
      colorHex: parsed.data.colorHex,
      workingHours: JSON.stringify(parsed.data.workingHours),
    },
  });

  res.json(schedule);
});

function defaultWorkingHours() {
  return {
    mon: [["09:00", "14:00"], ["16:00", "20:00"]],
    tue: [["09:00", "14:00"], ["16:00", "20:00"]],
    wed: [["09:00", "14:00"], ["16:00", "20:00"]],
    thu: [["09:00", "14:00"], ["16:00", "20:00"]],
    fri: [["09:00", "14:00"], ["16:00", "20:00"]],
    sat: [["10:00", "14:00"]],
    sun: [],
  };
}
