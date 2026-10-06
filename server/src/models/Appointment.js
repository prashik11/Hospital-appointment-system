const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    appointmentDate: {
      type: String,
      required: true,
    },

    preferredTime: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
      default: "PENDING",
    },

    adminNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// MongoDB indexes

appointmentSchema.index({
  doctorId: 1,
  appointmentDate: 1,
  preferredTime: 1,
  status: 1,
});

appointmentSchema.index({
  patientId: 1,
});

appointmentSchema.index({
  appointmentDate: 1,
});

appointmentSchema.index({
  status: 1,
});

module.exports = mongoose.model("Appointment", appointmentSchema);
