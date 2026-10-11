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
  { name: "Dr. Abhishek Sapkal", qualification: "MBBS — General Medicine (Russia)", specialization: "General Medicine", department: "General Medicine", image: "/doctors/dr-abhishek-sapkal.jpeg", services: ["Fever and common infections", "Diabetes and blood pressure care", "Thyroid and other common medical conditions", "General health check-ups", "Ongoing care for common adult health concerns"] },
  { name: "Dr. Prashant Jalak", qualification: "MBBS, MD (Neuropsychiatry); Fellowship in De-addiction, JJ Hospital, Mumbai", specialization: "Neuropsychiatry & De-addiction", department: "Neuropsychiatry", image: "/doctors/dr-prashant-jalak.jpeg", services: ["Depression and sadness", "Anxiety and restlessness", "Sexual health concerns", "Suicidal thoughts", "Alcohol, marijuana, tobacco and cigarette addiction", "Sleep problems", "Fits, epilepsy, seizures and dizziness"], availability: { days: ["Wednesday"], startTime: "18:00", endTime: "20:00" } },
  { name: "Dr. Ishan Gajbe", qualification: "MBBS, MD — Orthopaedic Surgeon", specialization: "Orthopaedics & Joint Replacement", department: "Orthopaedics", image: "/doctors/dr-ishan-gajbe.jpeg", services: ["Knee and joint replacement", "Bone diseases", "Joint pain and fractures", "Knee, back and neck pain", "Sports injuries", "Orthopaedic surgery"], availability: { days: ["Monday"], startTime: "18:00", endTime: "20:00" } },
  { name: "Dr. Sanket Nale", qualification: "MBBS, MD — Paediatric Cardiologist", specialization: "Paediatrics & Paediatric Cardiology", department: "Paediatrics", image: "/doctors/dr-sanket-nale.jpeg", services: ["Child health", "NICU and PICU care", "Vaccination", "Paediatric heart care", "Infectious diseases", "Growth and health concerns in young children"], availability: { days: ["Sunday"], startTime: "11:00", endTime: "14:00" } },
  { name: "Dr. Sanket Kamble", qualification: "MBBS, MD; Fellowship in 2-D Echo", specialization: "General Medicine", department: "General Medicine", image: "/doctors/dr-sanket-kamble.jpeg", services: ["Diabetes", "Blood pressure", "Thyroid conditions", "Asthma", "General medical care"], availability: { days: ["Thursday", "Friday"], startTime: "14:00", endTime: "16:00" } },
  { name: "Dr. Amol Chinde", qualification: "MBBS, MD — Dermatology, Venereology & Leprosy", specialization: "Dermatology, Hair & Skin", department: "Dermatology", image: "/doctors/dr-amol-chinde.jpeg", services: ["Skin and hair conditions", "Fungal infections", "Acne and pimples", "Skin allergies", "Hair fall and dandruff", "Platelet-rich plasma (PRP)", "Hair transplant", "Psoriasis and eczema"], availability: { days: ["Saturday"], startTime: "14:00", endTime: "16:00" } },
  { name: "Dr. Vasudev Pise", qualification: "MBBS, MS — General & Laparoscopic Surgeon", specialization: "General & Laparoscopic Surgery", department: "General Surgery", image: "/doctors/dr-vasudev-pise.jpeg", services: ["Gallstones", "Appendix conditions", "Hernia", "Fistula procedures", "Laparoscopic surgery", "Bypass surgery", "General, cancer and other surgeries"], availability: { days: ["Tuesday"], startTime: "15:00", endTime: "17:00" } },
  { name: "Dr. Harshada Magar", qualification: "MBBS, MS — ENT Specialist", specialization: "Ear, Nose & Throat (ENT)", department: "ENT", image: "/doctors/dr-harshada-magar.jpeg", services: ["Ear, nose and throat conditions", "Sinus and tonsil concerns", "Ear discharge and wounds", "Hearing loss", "Throat conditions", "Nosebleeds"], availability: { days: ["Friday"], startTime: "14:00", endTime: "16:00" } },
  { name: "Dr. Mehul Oswal", qualification: "MBBS, MD (Medicine), DNB (Cardiology) — Interventional Cardiologist", specialization: "Cardiology & Interventional Cardiology", department: "Cardiology", services: ["Heart attack and heart disease", "Angioplasty", "Angiography", "2-D Echo", "Severe heart disease and blockages", "Bypass surgery"] },
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
      existingDoctor.image = doctorData.image;
      existingDoctor.services = doctorData.services;
      if (!existingDoctor.availability && doctorData.availability) {
        existingDoctor.availability = doctorData.availability;
      }
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
