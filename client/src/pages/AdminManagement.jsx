import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";

import { GET_DEPARTMENTS, GET_DOCTORS } from "../graphql/queries";

import { CREATE_DEPARTMENT, CREATE_DOCTOR } from "../graphql/mutations";

function AdminManagement() {
  const { data: departmentData, refetch: refetchDepartments } =
    useQuery(GET_DEPARTMENTS);

  const { data: doctorData, refetch: refetchDoctors } = useQuery(GET_DOCTORS);

  const [createDepartment, { loading: creatingDepartment }] =
    useMutation(CREATE_DEPARTMENT);

  const [createDoctor, { loading: creatingDoctor }] =
    useMutation(CREATE_DOCTOR);

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

  const departments = departmentData?.departments || [];

  const doctors = doctorData?.doctors || [];

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="mb-8 text-3xl font-bold">Hospital Management</h1>

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
