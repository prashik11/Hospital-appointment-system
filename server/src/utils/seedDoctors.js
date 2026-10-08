const dotenv = require("dotenv");
dotenv.config();

const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((server) => server.trim()));
}

const mongoose = require("mongoose");
const Department = require("../models/Departments");
const Doctor = require("../models/Doctor");

const doctors = [
  { name: "Dr. Abhishek Sapkal", qualification: "MBBS - General Medicine (Russia)", specialization: "General Medicine", department: "General Medicine" },
  { name: "Dr. Prashant Jalak", qualification: "MBBS, MD Neuropsychiatry; Fellowship in De-addiction, JJ Hospital Mumbai", specialization: "Neuropsychiatry & De-addiction", department: "Neuropsychiatry" },
  { name: "Dr. Ishan Gajbe", qualification: "MBBS, MD Orthopaedic Surgeon", specialization: "Orthopaedics & Joint Replacement", department: "Orthopaedics" },
  { name: "Dr. Sanket Nale", qualification: "MBBS, MD Paediatric Cardiologist", specialization: "Paediatrics & Paediatric Cardiology", department: "Paediatrics" },
  { name: "Dr. Sanket Kamble", qualification: "MBBS, MD; Fellowship in 2-D Echo", specialization: "General Medicine", department: "General Medicine" },
  { name: "Dr. Amol Chinde", qualification: "MBBS, MD Dermatology, Venereology & Leprosy", specialization: "Dermatology, Hair & Skin", department: "Dermatology" },
  { name: "Dr. Vasudev Pise", qualification: "MBBS, MS General & Laparoscopic Surgeon", specialization: "General & Laparoscopic Surgery", department: "General Surgery" },
  { name: "Dr. Harshada Magar", qualification: "MBBS, MS ENT Specialist", specialization: "Ear, Nose & Throat (ENT)", department: "ENT" },
  { name: "Dr. Mehul Oswal", qualification: "MBBS, MD Medicine, DNB Cardiology; Interventional Cardiologist", specialization: "Cardiology & Interventional Cardiology", department: "Cardiology" },
];

async function seedDoctors() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be configured");

  await mongoose.connect(process.env.MONGO_URI);
  let created = 0;
  let updated = 0;

  for (const doctorData of doctors) {
    let department = await Department.findOne({ name: doctorData.department });
    if (!department) {
      department = await Department.create({
        name: doctorData.department,
        description: `${doctorData.department} consultations at Shree Pharma and Clinic.`,
      });
    }

    const escapedName = doctorData.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingDoctor = await Doctor.findOne({ name: new RegExp(`^${escapedName}$`, "i") });
    if (existingDoctor) {
      existingDoctor.name = doctorData.name;
      existingDoctor.qualification = doctorData.qualification;
      existingDoctor.specialization = doctorData.specialization;
      // Preserve an existing department assignment and activity state to avoid
      // changing the meaning of appointments already linked to this doctor.
      await existingDoctor.save();
      updated += 1;
      continue;
    }

    await Doctor.create({
      ...doctorData,
      departmentId: department._id,
      consultationFee: 0,
    });
    created += 1;
  }

  console.log(`Doctor data ready: ${created} created, ${updated} refreshed.`);
}

seedDoctors()
  .catch((error) => {
    console.error("Doctor seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
