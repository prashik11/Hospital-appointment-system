const dotenv = require("dotenv");
dotenv.config();

const dns = require("node:dns");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");

dns.setDefaultResultOrder("ipv4first");
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((server) => server.trim()));
}

async function diagnoseSlots() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be configured");
  await mongoose.connect(process.env.MONGO_URI);

  const groups = await Appointment.aggregate([
    { $match: { status: { $in: ["PENDING", "CONFIRMED"] } } },
    {
      $group: {
        _id: {
          doctorId: "$doctorId",
          date: "$appointmentDate",
          time: "$preferredTime",
        },
        appointments: {
          $push: { id: "$_id", status: "$status", createdAt: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { "_id.date": 1, "_id.time": 1 } },
  ]);

  if (groups.length === 0) {
    console.log("No duplicate active appointment slots found.");
    return;
  }

  const report = groups.map((group) => ({
    doctorId: String(group._id.doctorId),
    date: group._id.date,
    time: group._id.time,
    appointments: group.appointments.map(({ id, status, createdAt }) => ({
      id: String(id),
      status,
      createdAt,
    })),
  }));

  console.log(JSON.stringify(report, null, 2));
}

diagnoseSlots()
  .catch((error) => {
    console.error("Could not inspect appointment slots:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
