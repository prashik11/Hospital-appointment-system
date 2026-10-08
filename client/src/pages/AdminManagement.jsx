import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";

import { GET_DEPARTMENTS, GET_DOCTORS } from "../graphql/queries";

import {
  CREATE_DEPARTMENT,
  CREATE_DOCTOR,
  CHANGE_ADMIN_PASSWORD,
} from "../graphql/mutations";

function AdminManagement() {
  const navigate = useNavigate();
  const { data: departmentData, refetch: refetchDepartments } =
    useQuery(GET_DEPARTMENTS);

  const { data: doctorData, refetch: refetchDoctors } = useQuery(GET_DOCTORS);

  const [createDepartment, { loading: creatingDepartment }] =
    useMutation(CREATE_DEPARTMENT);

  const [createDoctor, { loading: creatingDoctor }] =
    useMutation(CREATE_DOCTOR);
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
    departmentId: "",
    consultationFee: "",
  });
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

          departmentId: doctor.departmentId,

          consultationFee: Number(doctor.consultationFee || 0),
        },
      });

      setDoctor({
        name: "",
        qualification: "",
        specialization: "",
        departmentId: "",
        consultationFee: "",
      });

      await refetchDoctors();
    } catch (error) {
      console.error("Doctor creation failed:", error);
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
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="mb-8 text-3xl font-bold">Hospital Management</h1>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
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

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Add Department</h2>

          <form
            onSubmit={handleDepartmentSubmit}
            className="grid gap-4 md:grid-cols-3"
          >
            <input
              type="text"
              placeholder="Department name"
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

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
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
              placeholder="Qualification"
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
              placeholder="Specialization"
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

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Doctors</h2>

          <div className="space-y-3">
            {doctors.map((doctor) => {
              const department = departments.find(
                (item) => item.id === doctor.departmentId,
              );

              return (
                <div key={doctor.id} className="rounded-lg border p-4">
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
