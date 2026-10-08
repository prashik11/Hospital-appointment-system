const { GraphQLError } = require("graphql");
const HOSPITAL_TIME_ZONE = process.env.HOSPITAL_TIME_ZONE || "Asia/Kolkata";

function userInputError(message) {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

function validateText(value, label, { required = true, max = 120 } = {}) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (required && !normalized) {
    throw userInputError(`${label} is required`);
  }

  if (normalized.length > max) {
    throw userInputError(`${label} must be ${max} characters or fewer`);
  }

  return normalized;
}

function hospitalLocalMinute(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HOSPITAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

function validateAppointmentDateTime(appointmentDate, preferredTime) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate || "")) {
    throw userInputError("Appointment date must use YYYY-MM-DD format");
  }

  const parsedDate = new Date(`${appointmentDate}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== appointmentDate
  ) {
    throw userInputError("Invalid appointment date");
  }

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(preferredTime || "")) {
    throw userInputError("Preferred time must use 24-hour HH:mm format");
  }

  const selected = `${appointmentDate}T${preferredTime}`;
  if (selected <= hospitalLocalMinute()) {
    throw userInputError("Appointment date and time cannot be in the past");
  }

  return selected;
}

function validateObjectId(value, label) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    throw userInputError(`${label} is invalid`);
  }
  return value;
}

module.exports = { validateText, validateAppointmentDateTime, validateObjectId, userInputError, HOSPITAL_TIME_ZONE };
