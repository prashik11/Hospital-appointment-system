const Department = require("../models/Departments");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

const { generateToken } = require("../utils/auth");

const { getAuthAdmin } = require("../middleware/auth");
const { randomBytes } = require("node:crypto");

const resolvers = {
  Query: {
    hello: () => {
      return "Hospital Appointment API is working!";
    },

    departments: async () => {
      return await Department.find({ isActive: true }).sort({
        name: 1,
      });
    },

    doctors: async () => {
      return await Doctor.find({ isActive: true }).sort({
        name: 1,
      });
    },

    appointments: async (_, __, context) => {
      getAuthAdmin(context.req);

      return await Appointment.find()
        .populate("patientId")
        .populate("doctorId")
        .populate("departmentId")
        .sort({
          createdAt: -1,
        });
    },
  },

  Appointment: {
    patient: (appointment) => appointment.patientId,
    doctor: (appointment) => appointment.doctorId,
    department: (appointment) => appointment.departmentId,
  },

  Mutation: {
    loginAdmin: async (_, args) => {
      const { email, password } = args;

      const admin = await Admin.findOne({
        email: email.trim().toLowerCase(),
        isActive: true,
      });

      if (!admin) {
        throw new Error("Invalid email or password");
      }

      const passwordMatches = await bcrypt.compare(password, admin.password);

      if (!passwordMatches) {
        throw new Error("Invalid email or password");
      }

      const token = generateToken(admin);

      return {
        token,
        admin,
      };
    },
    createDepartment: async (_, args, context) => {
      getAuthAdmin(context.req);
      const { name, description } = args;

      const existingDepartment = await Department.findOne({
        name: name.trim(),
      });

      if (existingDepartment) {
        throw new Error("Department already exists");
      }

      const department = await Department.create({
        name: name.trim(),
        description: description?.trim(),
      });

      return department;
    },

    createDoctor: async (_, args, context) => {
      getAuthAdmin(context.req);
      const {
        name,
        qualification,
        specialization,
        departmentId,
        consultationFee,
      } = args;

      const department = await Department.findById(departmentId);

      if (!department) {
        throw new Error("Department not found");
      }

      const doctor = await Doctor.create({
        name: name.trim(),
        qualification: qualification?.trim(),
        specialization: specialization.trim(),
        departmentId,
        consultationFee: consultationFee || 0,
      });

      return doctor;
    },

    createAppointment: async (_, args) => {
      const {
        name,
        mobile,
        age,
        gender,
        departmentId,
        doctorId,
        appointmentDate,
        preferredTime,
        reason,
      } = args;

      // 1. Validate mobile number
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        throw new Error("Please enter a valid 10-digit mobile number");
      }

      // 2. Validate appointment date and time
      const selectedDate = new Date(`${appointmentDate}T${preferredTime}:00`);

      if (Number.isNaN(selectedDate.getTime())) {
        throw new Error("Invalid appointment date or time");
      }

      if (selectedDate < new Date()) {
        throw new Error("Appointment date and time cannot be in the past");
      }

      // 3. Validate department
      const department = await Department.findOne({
        _id: departmentId,
        isActive: true,
      });

      if (!department) {
        throw new Error("Department not found or inactive");
      }

      // 4. Validate doctor
      const doctor = await Doctor.findOne({
        _id: doctorId,
        isActive: true,
      });

      if (!doctor) {
        throw new Error("Doctor not found or inactive");
      }

      if (doctor.departmentId.toString() !== departmentId) {
        throw new Error("Selected doctor does not belong to this department");
      }

      const patient = await Patient.create({
        name: name.trim(),
        mobile: mobile.trim(),
        age,
        gender,
      });

      const appointment = await Appointment.create({
        appointmentNumber: `APT-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`,
        patientId: patient._id,
        doctorId: doctor._id,
        departmentId: department._id,
        appointmentDate,
        preferredTime,
        reason: reason?.trim() || undefined,
      });

      await appointment.populate(["patientId", "doctorId", "departmentId"]);

      return appointment;
    },

    updateAppointmentStatus: async (_, args, context) => {
      getAuthAdmin(context.req);

      const { appointmentId, status, adminNote } = args;

      // 1. Find appointment
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // 2. Update status
      appointment.status = status;

      // 3. Update admin note if provided
      if (adminNote !== undefined) {
        appointment.adminNote = adminNote.trim();
      }

      // 4. Save changes
      await appointment.save();

      // 5. Populate related data
      await appointment.populate([
        {
          path: "patientId",
        },
        {
          path: "doctorId",
        },
        {
          path: "departmentId",
        },
      ]);

      return appointment;
    },

    updateAppointmentSchedule: async (_, args, context) => {
      getAuthAdmin(context.req);

      const { appointmentId, appointmentDate, preferredTime, adminNote } = args;

      if (!appointmentDate) {
        throw new Error("Appointment date is required");
      }

      if (!preferredTime) {
        throw new Error("Preferred time is required");
      }

      const selectedDate = new Date(`${appointmentDate}T${preferredTime}:00`);

      if (Number.isNaN(selectedDate.getTime())) {
        throw new Error("Invalid appointment date or time");
      }

      if (selectedDate < new Date()) {
        throw new Error("Appointment date and time cannot be in the past");
      }

      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      if (
        appointment.status === "CANCELLED" ||
        appointment.status === "COMPLETED"
      ) {
        throw new Error("This appointment cannot be rescheduled");
      }

      const existingAppointment = await Appointment.findOne({
        _id: { $ne: appointmentId },

        doctorId: appointment.doctorId,

        appointmentDate,

        preferredTime,

        status: {
          $in: ["PENDING", "CONFIRMED"],
        },
      });

      if (existingAppointment) {
        throw new Error(
          "This doctor already has an appointment at this date and time",
        );
      }

      appointment.appointmentDate = appointmentDate;

      appointment.preferredTime = preferredTime;

      appointment.adminNote = adminNote || "Appointment rescheduled by admin";

      await appointment.save();

      return await Appointment.findById(appointmentId)
        .populate("patientId")
        .populate("doctorId")
        .populate("departmentId");
    },
  },
};

module.exports = resolvers;
