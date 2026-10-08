const Department = require("../models/Departments");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

const bcrypt = require("bcryptjs");
const { GraphQLError } = require("graphql");
const Admin = require("../models/Admin");

const {
  createAdminSession,
  revokeAdminSession,
  revokeAllAdminSessions,
  getAuthAdmin,
} = require("../middleware/auth");
const { randomBytes } = require("node:crypto");
const { consumeRateLimit } = require("../utils/rateLimit");
const { validateText, validateAppointmentDateTime, validateObjectId, userInputError } = require("../utils/validation");

function rateLimitError() {
  return new GraphQLError("Too many requests. Please try again later.", {
    extensions: { code: "TOO_MANY_REQUESTS" },
  });
}

const resolvers = {
  Query: {
    hello: () => {
      return "Hospital Appointment API is working!";
    },

    me: async (_, __, context) => getAuthAdmin(context.req),

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

    appointments: async (_, { limit = 100, offset = 0 }, context) => {
      await getAuthAdmin(context.req);

      return await Appointment.find()
        .populate("patientId")
        .populate("doctorId")
        .populate("departmentId")
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .limit(Math.min(Math.max(Number(limit) || 100, 1), 100))
        .skip(Math.min(Math.max(Number(offset) || 0, 0), 50_000));
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
    loginAdmin: async (_, args, context) => {
      const { email, password } = args;
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail.length > 254 || typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
        throw new GraphQLError("Invalid email or password", { extensions: { code: "UNAUTHENTICATED" } });
      }
      const clientIp = context.req.ip || "unknown";
      const attempt = consumeRateLimit(`admin-login:${clientIp}:${normalizedEmail}`, {
        limit: 5,
        windowMs: 15 * 60 * 1000,
      });
      const ipAttempt = consumeRateLimit(`admin-login-ip:${clientIp}`, {
        limit: 20,
        windowMs: 15 * 60 * 1000,
      });
      if (!attempt.allowed || !ipAttempt.allowed) {
        throw rateLimitError();
      }

      const admin = await Admin.findOne({
        email: normalizedEmail,
        isActive: true,
      }).select("+password");

      const passwordMatches = admin
        ? await bcrypt.compare(password, admin.password)
        : await bcrypt.compare(password, "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
      if (!admin || !passwordMatches) {
        throw new GraphQLError("Invalid email or password", { extensions: { code: "UNAUTHENTICATED" } });
      }

      await createAdminSession(admin, context.res);

      return {
        admin,
      };
    },

    logoutAdmin: async (_, __, context) => {
      await revokeAdminSession(context.req, context.res);
      return true;
    },

    changeAdminPassword: async (_, { currentPassword, newPassword }, context) => {
      const authenticatedAdmin = await getAuthAdmin(context.req);
      if (
        typeof newPassword !== "string" ||
        newPassword.length < 12 ||
        Buffer.byteLength(newPassword, "utf8") > 72
      ) {
        throw userInputError("New password must be at least 12 characters and at most 72 UTF-8 bytes");
      }

      const admin = await Admin.findById(authenticatedAdmin._id).select("+password");
      if (!admin || !(await bcrypt.compare(currentPassword, admin.password))) {
        throw userInputError("Current password is incorrect");
      }

      admin.password = await bcrypt.hash(newPassword, 12);
      await admin.save();
      await revokeAllAdminSessions(admin._id, context.req, context.res);
      return true;
    },

    // ==========================================
    // CREATE DEPARTMENT
    // ADMIN ONLY
    // ==========================================
    createDepartment: async (_, args, context) => {
      await getAuthAdmin(context.req);

      const name = validateText(args.name, "Department name", { max: 80 });
      const description = validateText(args.description || "", "Description", { required: false, max: 500 });

      const existingDepartment = await Department.findOne({
        name,
      });

      if (existingDepartment) {
        throw userInputError("Department already exists");
      }

      const department = await Department.create({
        name: name.trim(),
        description: description || undefined,
      });

      return department;
    },

    // ==========================================
    // CREATE DOCTOR
    // ADMIN ONLY
    // ==========================================
    createDoctor: async (_, args, context) => {
      await getAuthAdmin(context.req);

      const {
        name,
        qualification,
        specialization,
        departmentId,
        consultationFee,
      } = args;

      const cleanName = validateText(name, "Doctor name", { max: 100 });
      const cleanQualification = validateText(qualification || "", "Qualification", { required: false, max: 100 });
      const cleanSpecialization = validateText(specialization, "Specialization", { max: 100 });
      if (consultationFee != null && (!Number.isFinite(consultationFee) || consultationFee < 0)) {
        throw userInputError("Consultation fee must be a non-negative number");
      }

      const department = await Department.findOne({
        _id: validateObjectId(departmentId, "Department ID"),
        isActive: true,
      });

      if (!department) {
        throw userInputError("Department not found or inactive");
      }

      const doctor = await Doctor.create({
        name: cleanName,
        qualification: cleanQualification || undefined,
        specialization: cleanSpecialization,
        departmentId,
        consultationFee: consultationFee || 0,
      });

      return doctor;
    },

    // ==========================================
    // CREATE APPOINTMENT
    // PUBLIC
    // ==========================================
    createAppointment: async (_, args, context) => {
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
      const patientName = validateText(name, "Name", { max: 100 });
      const normalizedMobile = validateText(mobile, "Mobile number", { max: 10 });
      const cleanReason = validateText(reason || "", "Reason", { required: false, max: 1000 });
      if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
        throw userInputError("Please enter a valid 10-digit mobile number");
      }
      if (!Number.isInteger(age) || age < 1 || age > 120) {
        throw userInputError("Age must be a whole number between 1 and 120");
      }
      if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
        throw userInputError("Please select a valid gender");
      }

      validateAppointmentDateTime(appointmentDate, preferredTime);

      const bookingRate = consumeRateLimit(`appointment:${context.req.ip || "unknown"}`, {
        limit: 5,
        windowMs: 15 * 60 * 1000,
      });
      if (!bookingRate.allowed) {
        throw rateLimitError();
      }

      // ------------------------------------------
      // 3. Validate department
      // ------------------------------------------
      const department = await Department.findOne({
        _id: validateObjectId(departmentId, "Department ID"),
        isActive: true,
      });

      if (!department) {
        throw userInputError("Department not found or inactive");
      }

      // ------------------------------------------
      // 4. Validate doctor
      // ------------------------------------------
      const doctor = await Doctor.findOne({
        _id: validateObjectId(doctorId, "Doctor ID"),
        isActive: true,
      });

      if (!doctor) {
        throw userInputError("Doctor not found or inactive");
      }

      // ------------------------------------------
      // 5. Check doctor belongs to department
      // ------------------------------------------
      if (doctor.departmentId.toString() !== departmentId.toString()) {
        throw userInputError("Selected doctor does not belong to this department");
      }

      // ------------------------------------------
      // 6. Check duplicate doctor slot
      // ------------------------------------------
      const existingAppointment = await Appointment.findOne({
        doctorId,
        appointmentDate,
        preferredTime,
        status: {
          $in: ["PENDING", "CONFIRMED"],
        },
      });

      if (existingAppointment) {
        throw userInputError("This time slot is already booked for this doctor");
      }

      // ------------------------------------------
      // 7. Create patient
      // ------------------------------------------
      const patient = await Patient.create({
        name: patientName,
        mobile: normalizedMobile,
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
      let appointment;
      try {
        appointment = await Appointment.create({
          appointmentNumber,
          patientId: patient._id,
          doctorId: doctor._id,
          departmentId: department._id,
          appointmentDate,
          preferredTime,
          reason: cleanReason || undefined,
          status: "PENDING",
        });
      } catch (error) {
        await Patient.deleteOne({ _id: patient._id });
        if (error.code === 11000) {
          throw userInputError("This time slot is already booked for this doctor");
        }
        throw error;
      }

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
      await getAuthAdmin(context.req);

      const { appointmentId, status, adminNote } = args;
      validateObjectId(appointmentId, "Appointment ID");

      // ------------------------------------------
      // 1. Find appointment
      // ------------------------------------------
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        throw userInputError("Appointment not found");
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
        throw userInputError(
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
        appointment.adminNote = validateText(adminNote, "Admin note", { required: false, max: 1000 });
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
      await getAuthAdmin(context.req);

      const { appointmentId, appointmentDate, preferredTime, adminNote } = args;
      validateObjectId(appointmentId, "Appointment ID");

      validateAppointmentDateTime(appointmentDate, preferredTime);

      // ------------------------------------------
      // 4. Find appointment
      // ------------------------------------------
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        throw userInputError("Appointment not found");
      }

      // ------------------------------------------
      // 5. Check status
      // ------------------------------------------
      if (
        appointment.status === "CANCELLED" ||
        appointment.status === "COMPLETED"
      ) {
        throw userInputError("This appointment cannot be rescheduled");
      }

      // ------------------------------------------
      // 6. Check duplicate slot
      // ------------------------------------------
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

      if (existingAppointment) {
        throw userInputError(
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
      appointment.adminNote = validateText(
        adminNote || "Appointment rescheduled by admin",
        "Admin note",
        { max: 1000 },
      );

      // ------------------------------------------
      // 10. Save
      // ------------------------------------------
      try {
        await appointment.save();
      } catch (error) {
        if (error.code === 11000) {
          throw userInputError("This doctor already has an appointment at this date and time");
        }
        throw error;
      }

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
