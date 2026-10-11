import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";

import { GET_DEPARTMENTS, GET_DOCTORS } from "../graphql/queries";
import { doctorProfiles } from "../data/doctors";

import {
  CREATE_DEPARTMENT,
  CREATE_DOCTOR,
  CHANGE_ADMIN_PASSWORD,
  UPDATE_DOCTOR_AVAILABILITY,
} from "../graphql/mutations";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function DaySelector({ selectedDays, onChange }) {
  const toggleDay = (day) => {
    onChange(selectedDays.includes(day)
      ? selectedDays.filter((selectedDay) => selectedDay !== day)
      : [...selectedDays, day]);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {WEEKDAYS.map((day) => (
        <label key={day} className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={selectedDays.includes(day)} onChange={() => toggleDay(day)} />
          {day}
        </label>
      ))}
    </div>
  );
}

function formatSchedule(availability) {
  if (!availability?.days?.length || !availability.startTime || !availability.endTime) return "Schedule not set";
  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${period}`;
  };
  return `${availability.days.join(" & ")} · ${formatTime(availability.startTime)} – ${formatTime(availability.endTime)}`;
}

function AdminManagement() {
  const navigate = useNavigate();
  const { data: departmentData, refetch: refetchDepartments } =
    useQuery(GET_DEPARTMENTS);

  const { data: doctorData, refetch: refetchDoctors } = useQuery(GET_DOCTORS);

  const [createDepartment, { loading: creatingDepartment }] =
    useMutation(CREATE_DEPARTMENT);

  const [createDoctor, { loading: creatingDoctor }] =
    useMutation(CREATE_DOCTOR);
  const [updateDoctorAvailability, { loading: updatingAvailability }] =
    useMutation(UPDATE_DOCTOR_AVAILABILITY);
  const [changeAdminPassword, { loading: changingPassword, error: passwordError }] =
    useMutation(CHANGE_ADMIN_PASSWORD);

  const [department, setDepartment] = useState({
    name: "",
    description: "",
  });

  const [doctor, setDoctor] = useState({
    name: "",
    qualification: "",
    specialization: "",
    image: "",
    servicesText: "",
    availabilityDays: [],
    startTime: "",
    endTime: "",
    departmentId: "",
    consultationFee: "",
  });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleError, setScheduleError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

  const handleDepartmentSubmit = async (event) => {
    event.preventDefault();

    if (!department.name.trim()) {
      return;
    }

    try {
      await createDepartment({
        variables: {
          name: department.name.trim(),

          description: department.description.trim() || null,
        },
      });

      setDepartment({
        name: "",
        description: "",
      });

      await refetchDepartments();
    } catch (error) {
      console.error("Department creation failed:", error);
    }
  };

  const handleDoctorSubmit = async (event) => {
    event.preventDefault();

    try {
      await createDoctor({
        variables: {
          name: doctor.name.trim(),

          qualification: doctor.qualification.trim() || null,

          specialization: doctor.specialization.trim(),

          image: doctor.image.trim() || null,

          services: doctor.servicesText.split("\n").map((service) => service.trim()).filter(Boolean),

          availability: doctor.availabilityDays.length
            ? { days: doctor.availabilityDays, startTime: doctor.startTime, endTime: doctor.endTime }
            : null,

          departmentId: doctor.departmentId,

          consultationFee: Number(doctor.consultationFee || 0),
        },
      });

      setDoctor({
        name: "",
        qualification: "",
        specialization: "",
        image: "",
        servicesText: "",
        availabilityDays: [],
        startTime: "",
        endTime: "",
        departmentId: "",
        consultationFee: "",
      });

      await refetchDoctors();
    } catch (error) {
      console.error("Doctor creation failed:", error);
    }
  };

  const beginScheduleEdit = (doctor) => {
    const availability = doctor.availability || doctorProfiles.find((profile) => profile.name === doctor.name)?.availability || {};
    setScheduleError("");
    setEditingSchedule({
      doctorId: doctor.id,
      days: availability.days || [],
      startTime: availability.startTime || "",
      endTime: availability.endTime || "",
    });
  };

  const handleScheduleSave = async (event) => {
    event.preventDefault();
    setScheduleError("");
    try {
      await updateDoctorAvailability({
        variables: {
          doctorId: editingSchedule.doctorId,
          availability: {
            days: editingSchedule.days,
            startTime: editingSchedule.startTime,
            endTime: editingSchedule.endTime,
          },
        },
      });
      await refetchDoctors();
      setEditingSchedule(null);
    } catch (error) {
      setScheduleError(error.message || "Could not update the doctor's schedule.");
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    try {
      await changeAdminPassword({ variables: passwordForm });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      navigate("/admin/login", { replace: true });
    } catch {
      // The mutation error is rendered below without logging credentials.
    }
  };

  const departments = departmentData?.departments || [];

  const doctors = doctorData?.doctors || [];

  return (
    <main className="admin-page min-h-screen py-10">
      <div className="admin-content mx-auto max-w-6xl px-6">
        <div className="admin-page-header mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-blue-700">ADMIN PANEL</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Clinic Management</h1>
            <p className="mt-2 text-gray-600">Manage departments, doctors and account security.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/appointments")}
            className="interactive-button rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
          >
            Appointments
          </button>
        </div>

        <section className="admin-section-card mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-bold">Change Admin Password</h2>
          <p className="mb-5 text-sm text-gray-600">
            Use at least 12 characters. Changing it signs out all active admin sessions.
          </p>
          <form onSubmit={handlePasswordChange} className="grid gap-4 md:grid-cols-3">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((previous) => ({ ...previous, currentPassword: event.target.value }))}
              required
              className="rounded-lg border px-4 py-3"
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="New password (12+ characters)"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))}
              minLength={12}
              maxLength={72}
              required
              className="rounded-lg border px-4 py-3"
            />
            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-lg bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-gray-400"
            >
              {changingPassword ? "Updating..." : "Change Password"}
            </button>
          </form>
          {passwordError && (
            <p role="alert" className="mt-4 text-sm text-red-700">{passwordError.message}</p>
          )}
        </section>

        {/* DEPARTMENT */}

        <section className="admin-section-card mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Add Department</h2>

          <form
            onSubmit={handleDepartmentSubmit}
            className="grid gap-4 md:grid-cols-3"
          >
            <input
              type="text"
              placeholder="Department name (e.g. General Medicine)"
              value={department.name}
              onChange={(event) =>
                setDepartment((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              required
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="text"
              placeholder="Description"
              value={department.description}
              onChange={(event) =>
                setDepartment((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              className="rounded-lg border px-4 py-3"
            />

            <button
              type="submit"
              disabled={creatingDepartment}
              className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:bg-gray-400"
            >
              {creatingDepartment ? "Adding..." : "Add Department"}
            </button>
          </form>
        </section>

        {/* DOCTOR */}

        <section className="admin-section-card mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Add Doctor</h2>

          <form
            onSubmit={handleDoctorSubmit}
            className="grid gap-4 md:grid-cols-2"
          >
            <input
              type="text"
              placeholder="Doctor name"
              value={doctor.name}
              onChange={(event) =>
                setDoctor((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              required
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="text"
              placeholder="Qualification (e.g. MBBS, MD)"
              value={doctor.qualification}
              onChange={(event) =>
                setDoctor((previous) => ({
                  ...previous,
                  qualification: event.target.value,
                }))
              }
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="text"
              placeholder="Specialization shown on doctor card"
              value={doctor.specialization}
              onChange={(event) =>
                setDoctor((previous) => ({
                  ...previous,
                  specialization: event.target.value,
                }))
              }
              required
              className="rounded-lg border px-4 py-3"
            />

            <input
              type="text"
              placeholder="Photo path or HTTPS URL (optional)"
              value={doctor.image}
              onChange={(event) => setDoctor((previous) => ({ ...previous, image: event.target.value }))}
              className="rounded-lg border px-4 py-3"
            />

            <textarea
              placeholder="Areas of care — one item per line"
              value={doctor.servicesText}
              onChange={(event) => setDoctor((previous) => ({ ...previous, servicesText: event.target.value }))}
              rows={4}
              className="rounded-lg border px-4 py-3 md:col-span-2"
            />

            <fieldset className="rounded-lg border p-4 md:col-span-2">
              <legend className="px-1 text-sm font-semibold text-gray-700">Consultation schedule (optional)</legend>
              <p className="mb-3 text-sm text-gray-500">Select consultation days and enter the clinic hours.</p>
              <DaySelector
                selectedDays={doctor.availabilityDays}
                onChange={(days) => setDoctor((previous) => ({ ...previous, availabilityDays: days }))}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-600">From
                  <input type="time" value={doctor.startTime} required={doctor.availabilityDays.length > 0}
                    onChange={(event) => setDoctor((previous) => ({ ...previous, startTime: event.target.value }))}
                    className="mt-1 block w-full rounded-lg border px-4 py-3" />
                </label>
                <label className="text-sm text-gray-600">To
                  <input type="time" value={doctor.endTime} required={doctor.availabilityDays.length > 0}
                    onChange={(event) => setDoctor((previous) => ({ ...previous, endTime: event.target.value }))}
                    className="mt-1 block w-full rounded-lg border px-4 py-3" />
                </label>
              </div>
            </fieldset>

            <select
              value={doctor.departmentId}
              onChange={(event) =>
                setDoctor((previous) => ({
                  ...previous,
                  departmentId: event.target.value,
                }))
              }
              required
              className="rounded-lg border px-4 py-3"
            >
              <option value="">Select department</option>

              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Consultation fee"
              value={doctor.consultationFee}
              onChange={(event) =>
                setDoctor((previous) => ({
                  ...previous,
                  consultationFee: event.target.value,
                }))
              }
              min="0"
              className="rounded-lg border px-4 py-3"
            />

            <button
              type="submit"
              disabled={creatingDoctor}
              className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:bg-gray-400"
            >
              {creatingDoctor ? "Adding..." : "Add Doctor"}
            </button>
          </form>
        </section>

        {/* LIST */}

        <section className="admin-section-card rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Doctors</h2>

          <div className="space-y-3">
            {doctors.map((doctor) => {
              const department = departments.find(
                (item) => item.id === doctor.departmentId,
              );
              const availability = doctor.availability || doctorProfiles.find((profile) => profile.name === doctor.name)?.availability;

              return (
                <div key={doctor.id} className="admin-doctor-row rounded-xl border p-4">
                  {doctor.image && <img src={doctor.image} alt="" className="mb-3 h-16 w-16 rounded-full object-cover object-top" />}
                  <p className="font-semibold">{doctor.name}</p>

                  <p className="text-sm text-gray-500">
                    {doctor.qualification}
                  </p>

                  <p className="text-sm text-gray-500">
                    {doctor.specialization}
                  </p>

                  <p className="text-sm text-gray-500">
                    Department: {department?.name || "Unknown"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-gray-600">Consultation: {formatSchedule(availability)}</p>
                    <button type="button" onClick={() => beginScheduleEdit(doctor)}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                      Edit timing
                    </button>
                  </div>

                  {editingSchedule?.doctorId === doctor.id && (
                    <form onSubmit={handleScheduleSave} className="mt-4 space-y-4 rounded-xl bg-blue-50 p-4">
                      <p className="font-semibold text-gray-800">Edit consultation timing</p>
                      <DaySelector
                        selectedDays={editingSchedule.days}
                        onChange={(days) => setEditingSchedule((previous) => ({ ...previous, days }))}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm text-gray-600">From
                          <input type="time" value={editingSchedule.startTime} required
                            onChange={(event) => setEditingSchedule((previous) => ({ ...previous, startTime: event.target.value }))}
                            className="mt-1 block w-full rounded-lg border bg-white px-4 py-3" />
                        </label>
                        <label className="text-sm text-gray-600">To
                          <input type="time" value={editingSchedule.endTime} required
                            onChange={(event) => setEditingSchedule((previous) => ({ ...previous, endTime: event.target.value }))}
                            className="mt-1 block w-full rounded-lg border bg-white px-4 py-3" />
                        </label>
                      </div>
                      {scheduleError && <p role="alert" className="text-sm text-red-700">{scheduleError}</p>}
                      <div className="flex gap-2">
                        <button type="submit" disabled={updatingAvailability}
                          className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-gray-400">
                          {updatingAvailability ? "Saving..." : "Save timing"}
                        </button>
                        <button type="button" onClick={() => setEditingSchedule(null)}
                          className="rounded-lg border px-4 py-2 font-semibold text-gray-700">Cancel</button>
                      </div>
                    </form>
                  )}

                  {doctor.services?.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      Areas of care: {doctor.services.join(" • ")}
                    </p>
                  )}

                  <p className="text-sm text-gray-500">
                    Fee: ₹{doctor.consultationFee}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminManagement;
