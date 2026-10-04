import { useQuery, useMutation } from "@apollo/client/react";
import { GET_APPOINTMENTS } from "../graphql/queries";
import {
  UPDATE_APPOINTMENT_STATUS,
  UPDATE_APPOINTMENT_SCHEDULE,
} from "../graphql/mutations";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function getStatusClasses(status) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    case "CONFIRMED":
      return "bg-green-100 text-green-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    case "COMPLETED":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function AdminAppointments() {
  const { loading, error, data, refetch } = useQuery(GET_APPOINTMENTS);
  const navigate = useNavigate();
  const [updateAppointmentStatus, { loading: updating }] = useMutation(
    UPDATE_APPOINTMENT_STATUS,
  );
  const [updateAppointmentSchedule, { loading: rescheduling }] = useMutation(
    UPDATE_APPOINTMENT_SCHEDULE,
  );
  const [notes, setNotes] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");

  const handleStatusChange = async (appointmentId, status) => {
    try {
      await updateAppointmentStatus({
        variables: {
          appointmentId,
          status,
          adminNote: notes[appointmentId]?.trim() || null,
        },
      });

      await refetch();

      setNotes((previousNotes) => ({
        ...previousNotes,
        [appointmentId]: "",
      }));
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading appointments...</div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        Failed to load appointments.
      </div>
    );
  }

  const appointments = data?.appointments || [];

  const filteredAppointments =
    statusFilter === "ALL"
      ? appointments
      : appointments.filter(
          (appointment) => appointment.status === statusFilter,
        );

  const getStatusCount = (status) => {
    if (status === "ALL") {
      return appointments.length;
    }

    return appointments.filter((appointment) => appointment.status === status)
      .length;
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");

    navigate("/admin/login");
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-600">ADMIN PANEL</p>

            <h1 className="mt-2 text-3xl font-bold">Appointment Management</h1>

            <p className="mt-2 text-gray-600">
              View and manage patient appointment requests.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-4 py-2 font-semibold ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                }`}
              >
                {status === "ALL" ? "All" : status} ({getStatusCount(status)})
              </button>
            ),
          )}
        </div>

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-4 text-left">Appointment</th>

                <th className="px-4 py-4 text-left">Patient</th>

                <th className="px-4 py-4 text-left">Doctor</th>

                <th className="px-4 py-4 text-left">Date</th>

                <th className="px-4 py-4 text-left">Time</th>

                <th className="px-4 py-4 text-left">Reason</th>

                <th className="px-4 py-4 text-left">Admin Note</th>

                <th className="px-4 py-4 text-left">Status</th>

                <th className="px-4 py-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-t">
                  <td className="px-4 py-4 font-semibold">
                    {appointment.appointmentNumber}
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-medium">{appointment.patient.name}</p>

                    <p className="text-sm text-gray-500">
                      {appointment.patient.mobile}
                    </p>

                    <p className="text-sm text-gray-500">
                      Age: {appointment.patient.age} | Gender:{" "}
                      {appointment.patient.gender}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p>{appointment.doctor.name}</p>

                    <p className="text-sm text-gray-500">
                      {appointment.doctor.specialization}
                    </p>
                  </td>

                  <td className="px-4 py-4">{appointment.appointmentDate}</td>

                  <td className="px-4 py-4">{appointment.preferredTime}</td>

                  <td className="px-4 py-4">{appointment.reason || "—"}</td>

                  <td className="px-4 py-4">
                    {appointment.adminNote ? (
                      <p className="max-w-xs text-sm text-gray-600">
                        {appointment.adminNote}
                      </p>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                        appointment.status,
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="min-w-[250px] space-y-2">
                      <input
                        type="text"
                        value={notes[appointment.id] || ""}
                        onChange={(event) =>
                          setNotes((previousNotes) => ({
                            ...previousNotes,
                            [appointment.id]: event.target.value,
                          }))
                        }
                        placeholder="Admin note"
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600"
                      />

                      <div className="flex gap-2">
                        {appointment.status === "PENDING" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(appointment.id, "CONFIRMED")
                              }
                              disabled={updating}
                              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                            >
                              Confirm
                            </button>

                            <button
                              onClick={() =>
                                handleStatusChange(appointment.id, "CANCELLED")
                              }
                              disabled={updating}
                              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {appointment.status === "CONFIRMED" && (
                          <button
                            onClick={() =>
                              handleStatusChange(appointment.id, "COMPLETED")
                            }
                            disabled={updating}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAppointments.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              No {statusFilter === "ALL" ? "" : statusFilter.toLowerCase()}{" "}
              appointments found.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminAppointments;
