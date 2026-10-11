const mongoose = require("mongoose");

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    days: {
      type: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }],
      required: true,
    },
    startTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
  },
  { _id: false },
);

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    qualification: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    image: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    services: {
      type: [String],
      default: [],
    },

    availability: { type: doctorAvailabilitySchema, default: undefined },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Doctor", doctorSchema);
