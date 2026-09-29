import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";

import Navbar from "../components/Navbar";

import { GET_DEPARTMENTS, GET_DOCTORS } from "../graphql/queries";
import { CREATE_APPOINTMENT } from "../graphql/mutations";

function Appointment() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    age: "",
    gender: "",
    departmentId: "",
    doctorId: "",
    appointmentDate: "",
    preferredTime: "",
    reason: "",
  });

  const {
    loading: departmentsLoading,
    error: departmentsError,
    data: departmentsData,
  } = useQuery(GET_DEPARTMENTS);

  const {
    loading: doctorsLoading,
    error: doctorsError,
    data: doctorsData,
  } = useQuery(GET_DOCTORS);

  const [createAppointment, { loading: submitting, error: submitError }] =
    useMutation(CREATE_APPOINTMENT);

  const [successData, setSuccessData] = useState(null);

  const departments = departmentsData?.departments || [];

  const doctors = doctorsData?.doctors || [];

  const filteredDoctors = doctors.filter(
    (doctor) => doctor.departmentId === formData.departmentId,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleDepartmentChange = (event) => {
    const departmentId = event.target.value;

    setFormData((previousData) => ({
      ...previousData,
      departmentId,
      doctorId: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const result = await createAppointment({
        variables: {
          name: formData.name,
          mobile: formData.mobile,
          age: Number(formData.age),
          gender: formData.gender,
          departmentId: formData.departmentId,
          doctorId: formData.doctorId,
          appointmentDate: formData.appointmentDate,
          preferredTime: formData.preferredTime,
          reason: formData.reason.trim() || null,
        },
      });

      setSuccessData(result.data.createAppointment);

      console.log("Appointment created:", result.data.createAppointment);
    } catch (error) {
      console.error("Appointment booking failed:", error);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="font-semibold text-blue-600">BOOK APPOINTMENT</p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Schedule Your Appointment
            </h1>

            <p className="mt-3 text-gray-600">
              Fill in your details and our hospital representative will contact
              you.
            </p>
          </div>

          {successData && (
            <div className="mb-8 rounded-2xl bg-green-50 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-green-700">
                Appointment Submitted Successfully
              </h2>

              <p className="mt-3 text-gray-700">
                Your appointment request has been submitted.
              </p>

              <div className="mt-6 space-y-2">
                <p>
                  <strong>Appointment No:</strong>{" "}
                  {successData.appointmentNumber}
                </p>

                <p>
                  <strong>Patient:</strong> {successData.patient.name}
                </p>

                <p>
                  <strong>Doctor:</strong> {successData.doctor.name}
                </p>

                <p>
                  <strong>Department:</strong> {successData.department.name}
                </p>

                <p>
                  <strong>Date:</strong> {successData.appointmentDate}
                </p>

                <p>
                  <strong>Preferred Time:</strong> {successData.preferredTime}
                </p>

                <p>
                  <strong>Status:</strong> {successData.status}
                </p>
              </div>

              <p className="mt-6 text-gray-600">
                Our hospital representative will contact you on your registered
                mobile number to confirm the appointment.
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-10 rounded-2xl bg-white p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold">Patient Details</h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="mb-2 block font-medium">Full Name</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="mb-2 block font-medium">Mobile Number</label>

                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              {/* Age */}
              <div>
                <label className="mb-2 block font-medium">Age</label>

                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                  min="0"
                  max="120"
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="mb-2 block font-medium">Gender</label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">Select gender</option>

                  <option value="MALE">Male</option>

                  <option value="FEMALE">Female</option>

                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="mb-2 block font-medium">Department</label>

                {departmentsLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading departments...
                  </p>
                ) : departmentsError ? (
                  <p className="text-sm text-red-600">
                    Failed to load departments.
                  </p>
                ) : (
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleDepartmentChange}
                    required
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option value="">Select department</option>

                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Doctor */}
              <div>
                <label className="mb-2 block font-medium">Doctor</label>

                {doctorsLoading ? (
                  <p className="text-sm text-gray-500">Loading doctors...</p>
                ) : doctorsError ? (
                  <p className="text-sm text-red-600">
                    Failed to load doctors.
                  </p>
                ) : (
                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    disabled={!formData.departmentId}
                    required
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600 disabled:bg-gray-100"
                  >
                    <option value="">
                      {formData.departmentId
                        ? "Select doctor"
                        : "Select department first"}
                    </option>

                    {filteredDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block font-medium">Preferred Date</label>

                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              {/* Time */}
              <div>
                <label className="mb-2 block font-medium">Preferred Time</label>

                <input
                  type="time"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              {/* Reason */}
              <div className="md:col-span-2">
                <label className="mb-2 block font-medium">
                  Reason for Visit
                </label>

                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Briefly describe your reason for appointment"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {submitError && (
              <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
                {submitError.message}
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {submitting
                  ? "Submitting Appointment..."
                  : "Submit Appointment"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default Appointment;
