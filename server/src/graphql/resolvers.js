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
    // ==========================================
    // ADMIN LOGIN
    // ==========================================
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

    // ==========================================
    // CREATE DEPARTMENT
    // ADMIN ONLY
    // ==========================================
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

    // ==========================================
    // CREATE DOCTOR
    // ADMIN ONLY
    // ==========================================
    createDoctor: async (_, args, context) => {
      getAuthAdmin(context.req);

      const {
        name,
        qualification,
        specialization,
        departmentId,
        consultationFee,
      } = args;

      const department = await Department.findOne({
        _id: departmentId,
        isActive: true,
      });

      if (!department) {
        throw new Error("Department not found or inactive");
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

    // ==========================================
    // CREATE APPOINTMENT
    // PUBLIC
    // ==========================================
    createAppointment: async (_, args) => {
      console.log("CREATE APPOINTMENT CALLED");

      console.log("ARGS:", args);

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

      // ------------------------------------------
      // 1. Validate mobile number
      // ------------------------------------------
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        throw new Error("Please enter a valid 10-digit mobile number");
      }

      // ------------------------------------------
      // 2. Validate appointment date and time
      // ------------------------------------------
      const selectedDate = new Date(`${appointmentDate}T${preferredTime}:00`);

      if (Number.isNaN(selectedDate.getTime())) {
        throw new Error("Invalid appointment date or time");
      }

      if (selectedDate < new Date()) {
        throw new Error("Appointment date and time cannot be in the past");
      }

      // ------------------------------------------
      // 3. Validate department
      // ------------------------------------------
      const department = await Department.findOne({
        _id: departmentId,
        isActive: true,
      });

      if (!department) {
        throw new Error("Department not found or inactive");
      }

      // ------------------------------------------
      // 4. Validate doctor
      // ------------------------------------------
      const doctor = await Doctor.findOne({
        _id: doctorId,
        isActive: true,
      });

      if (!doctor) {
        throw new Error("Doctor not found or inactive");
      }

      // ------------------------------------------
      // 5. Check doctor belongs to department
      // ------------------------------------------
      if (doctor.departmentId.toString() !== departmentId.toString()) {
        throw new Error("Selected doctor does not belong to this department");
      }

      // ------------------------------------------
      // 6. Check duplicate doctor slot
      // ------------------------------------------
      console.log("BOOKING CHECK:");

      console.log("doctorId:", doctorId);

      console.log("appointmentDate:", appointmentDate);

      console.log("preferredTime:", preferredTime);

      const existingAppointment = await Appointment.findOne({
        doctorId,
        appointmentDate,
        preferredTime,
        status: {
          $in: ["PENDING", "CONFIRMED"],
        },
      });

      console.log("EXISTING APPOINTMENT:", existingAppointment);

      if (existingAppointment) {
        throw new Error("This time slot is already booked for this doctor");
      }

      // ------------------------------------------
      // 7. Create patient
      // ------------------------------------------
      const patient = await Patient.create({
        name: name.trim(),
        mobile: mobile.trim(),
        age,
        gender,
      });

      // ------------------------------------------
      // 8. Generate appointment number
      // ------------------------------------------
      const appointmentNumber = `APT-${Date.now()}-${randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

      // ------------------------------------------
      // 9. Create appointment
      // ------------------------------------------
      const appointment = await Appointment.create({
        appointmentNumber,
        patientId: patient._id,
        doctorId: doctor._id,
        departmentId: department._id,
        appointmentDate,
        preferredTime,
        reason: reason?.trim() || undefined,
        status: "PENDING",
      });

      // ------------------------------------------
      // 10. Populate appointment
      // ------------------------------------------
      await appointment.populate(["patientId", "doctorId", "departmentId"]);

      return appointment;
    },

    // ==========================================
    // UPDATE APPOINTMENT STATUS
    // ADMIN ONLY
    // ==========================================
    updateAppointmentStatus: async (_, args, context) => {
      getAuthAdmin(context.req);

      const { appointmentId, status, adminNote } = args;

      // ------------------------------------------
      // 1. Find appointment
      // ------------------------------------------
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // ------------------------------------------
      // 2. Allowed status transitions
      // ------------------------------------------
      const allowedTransitions = {
        PENDING: ["CONFIRMED", "CANCELLED"],

        CONFIRMED: ["COMPLETED", "CANCELLED"],

        CANCELLED: [],

        COMPLETED: [],
      };

      if (!allowedTransitions[appointment.status].includes(status)) {
        throw new Error(
          `Cannot change appointment from ${appointment.status} to ${status}`,
        );
      }

      // ------------------------------------------
      // 3. Update status
      // ------------------------------------------
      appointment.status = status;

      // ------------------------------------------
      // 4. Update admin note
      // ------------------------------------------
      if (adminNote != null) {
        appointment.adminNote = adminNote.trim();
      }

      // ------------------------------------------
      // 5. Save
      // ------------------------------------------
      await appointment.save();

      // ------------------------------------------
      // 6. Populate
      // ------------------------------------------
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

    // ==========================================
    // RESCHEDULE APPOINTMENT
    // ADMIN ONLY
    // ==========================================
    updateAppointmentSchedule: async (_, args, context) => {
      getAuthAdmin(context.req);

      const { appointmentId, appointmentDate, preferredTime, adminNote } = args;

      // ------------------------------------------
      // 1. Validate date
      // ------------------------------------------
      if (!appointmentDate) {
        throw new Error("Appointment date is required");
      }

      // ------------------------------------------
      // 2. Validate time
      // ------------------------------------------
      if (!preferredTime) {
        throw new Error("Preferred time is required");
      }

      // ------------------------------------------
      // 3. Validate date and time
      // ------------------------------------------
      const selectedDate = new Date(`${appointmentDate}T${preferredTime}:00`);

      if (Number.isNaN(selectedDate.getTime())) {
        throw new Error("Invalid appointment date or time");
      }

      if (selectedDate < new Date()) {
        throw new Error("Appointment date and time cannot be in the past");
      }

      // ------------------------------------------
      // 4. Find appointment
      // ------------------------------------------
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // ------------------------------------------
      // 5. Check status
      // ------------------------------------------
      if (
        appointment.status === "CANCELLED" ||
        appointment.status === "COMPLETED"
      ) {
        throw new Error("This appointment cannot be rescheduled");
      }

      // ------------------------------------------
      // 6. Check duplicate slot
      // ------------------------------------------
      console.log("RESCHEDULE CHECK:");

      console.log("doctorId:", appointment.doctorId);

      console.log("appointmentDate:", appointmentDate);

      console.log("preferredTime:", preferredTime);

      const existingAppointment = await Appointment.findOne({
        _id: {
          $ne: appointmentId,
        },

        doctorId: appointment.doctorId,

        appointmentDate,

        preferredTime,

        status: {
          $in: ["PENDING", "CONFIRMED"],
        },
      });

      console.log("EXISTING RESCHEDULE APPOINTMENT:", existingAppointment);

      if (existingAppointment) {
        throw new Error(
          "This doctor already has an appointment at this date and time",
        );
      }

      // ------------------------------------------
      // 7. Update date
      // ------------------------------------------
      appointment.appointmentDate = appointmentDate;

      // ------------------------------------------
      // 8. Update time
      // ------------------------------------------
      appointment.preferredTime = preferredTime;

      // ------------------------------------------
      // 9. Update admin note
      // ------------------------------------------
      appointment.adminNote =
        adminNote?.trim() || "Appointment rescheduled by admin";

      // ------------------------------------------
      // 10. Save
      // ------------------------------------------
      await appointment.save();

      // ------------------------------------------
      // 11. Return populated appointment
      // ------------------------------------------
      return await Appointment.findById(appointmentId)
        .populate("patientId")
        .populate("doctorId")
        .populate("departmentId");
    },
  },
};

module.exports = resolvers;
