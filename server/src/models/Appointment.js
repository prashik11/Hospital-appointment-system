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
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    preferredTime: {
      type: String,
      required: true,
      match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
      default: "PENDING",
    },

    slotKey: {
      type: String,
      select: false,
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
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

appointmentSchema.index(
  { slotKey: 1 },
  {
    name: "unique_active_appointment_slot",
    unique: true,
    partialFilterExpression: { slotKey: { $type: "string" } },
  },
);

appointmentSchema.pre("validate", function setActiveSlotKey() {
  if (["PENDING", "CONFIRMED"].includes(this.status)) {
    this.slotKey = `${this.doctorId}:${this.appointmentDate}:${this.preferredTime}`;
  } else {
    this.slotKey = undefined;
  }
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
