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
  const [bookingError, setBookingError] = useState("");

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

    setBookingError("");

    // Mobile validation
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setBookingError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Age validation
    if (formData.age < 1 || formData.age > 120) {
      setBookingError("Please enter a valid age between 1 and 120.");
      return;
    }

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

      const appointment = result.data?.createAppointment;

      if (!appointment) {
        throw new Error("The server did not return the booked appointment.");
      }

      setSuccessData(appointment);
    } catch (error) {
      console.error("Appointment booking failed:", error);

      setBookingError(
        error.message || "Unable to book the appointment. Please try again.",
      );
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
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              role="presentation"
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-success-title"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-lg"
              >
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                    ✓
                  </div>

                  <h2
                    id="appointment-success-title"
                    className="mt-5 text-3xl font-bold text-green-700"
                  >
                    Appointment Submitted
                  </h2>

                  <p className="mt-3 text-gray-600">
                    Your appointment request has been successfully submitted.
                  </p>
                </div>

                <div className="mt-8 space-y-4 rounded-xl bg-gray-50 p-5">
                  <div>
                    <p className="text-sm text-gray-500">Appointment Number</p>

                    <p className="font-bold">{successData.appointmentNumber}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Patient</p>

                    <p className="font-semibold">{successData.patient.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Doctor</p>

                    <p className="font-semibold">{successData.doctor.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Date</p>

                    <p className="font-semibold">
                      {successData.appointmentDate}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Preferred Time</p>

                    <p className="font-semibold">{successData.preferredTime}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                  Our hospital representative will contact you on your
                  registered mobile number to confirm the appointment.
                </div>

                <button
                  type="button"
                  onClick={() => setSuccessData(null)}
                  className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </section>
            </div>
          )}

          {!successData && (
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
                  <label className="mb-2 block font-medium">
                    Mobile Number
                  </label>

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
                    min="1"
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
                  <label className="mb-2 block font-medium">
                    Preferred Date
                  </label>

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
                  <label className="mb-2 block font-medium">
                    Preferred Time
                  </label>

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

              {(bookingError || submitError) && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg bg-red-50 p-4 text-red-700"
                >
                  {bookingError || submitError.message}
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
          )}
        </div>
      </main>
    </>
  );
}

export default Appointment;
