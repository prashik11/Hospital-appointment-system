import { useQuery, useMutation } from "@apollo/client/react";
import { GET_APPOINTMENTS } from "../graphql/queries";
import {
  UPDATE_APPOINTMENT_STATUS,
  UPDATE_APPOINTMENT_SCHEDULE,
  LOGOUT_ADMIN,
} from "../graphql/mutations";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { convertToTimeInput, formatTimeForDisplay } from "../utils/dateTime";

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
  const [hasMore, setHasMore] = useState(true);
  const { loading, error, data, refetch, fetchMore } = useQuery(GET_APPOINTMENTS, {
    variables: { limit: 100, offset: 0 },
  });

  const navigate = useNavigate();

  const [updateAppointmentStatus, { loading: updating }] = useMutation(
    UPDATE_APPOINTMENT_STATUS,
  );

  const [updateAppointmentSchedule, { loading: rescheduling }] = useMutation(
    UPDATE_APPOINTMENT_SCHEDULE,
  );
  const [logoutAdmin] = useMutation(LOGOUT_ADMIN);

  const [notes, setNotes] = useState({});
  const [logoutError, setLogoutError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [rescheduleId, setRescheduleId] = useState(null);

  const [rescheduleData, setRescheduleData] = useState({
    appointmentDate: "",
    preferredTime: "",
  });

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
      setHasMore(true);

      setNotes((previousNotes) => ({
        ...previousNotes,
        [appointmentId]: "",
      }));
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const handleReschedule = async (appointmentId) => {
    try {
      await updateAppointmentSchedule({
        variables: {
          appointmentId,
          appointmentDate: rescheduleData.appointmentDate,
          preferredTime: rescheduleData.preferredTime,
          adminNote: "Appointment rescheduled by admin",
        },
      });

      await refetch();
      setHasMore(true);

      setRescheduleId(null);

      setRescheduleData({
        appointmentDate: "",
        preferredTime: "",
      });
    } catch (error) {
      console.error("Reschedule failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      navigate("/admin/login");
    } catch (error) {
      console.error("Admin logout failed:", error);
      setLogoutError("Could not end the admin session. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading appointments...</div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        <p>Failed to load appointments.</p>
        <p className="mt-2 text-sm">{error.message}</p>
      </div>
    );
  }

  const appointments = data?.appointments || [];

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const result = await fetchMore({
        variables: { limit: 100, offset: appointments.length },
        updateQuery(previous, { fetchMoreResult }) {
          if (!fetchMoreResult) return previous;
          return {
            ...previous,
            appointments: [...previous.appointments, ...fetchMoreResult.appointments],
          };
        },
      });
      setHasMore(result.data.appointments.length === 100);
    } catch (loadError) {
      console.error("Loading more appointments failed:", loadError);
    } finally {
      setLoadingMore(false);
    }
  };

  const totalAppointments = appointments.length;

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "PENDING",
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED",
  ).length;

  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === "CANCELLED",
  ).length;

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus =
      statusFilter === "ALL" || appointment.status === statusFilter;

    const matchesDate =
      !dateFilter || appointment.appointmentDate === dateFilter;

    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      appointment.appointmentNumber.toLowerCase().includes(searchText) ||
      appointment.patient.name.toLowerCase().includes(searchText) ||
      appointment.patient.mobile.includes(searchText) ||
      appointment.doctor.name.toLowerCase().includes(searchText);

    return matchesStatus && matchesDate && matchesSearch;
  });

  const getStatusCount = (status) => {
    if (status === "ALL") {
      return appointments.length;
    }

    return appointments.filter((appointment) => appointment.status === status)
      .length;
  };

  return (
    <main className="admin-page min-h-screen py-10">
      <div className="admin-content mx-auto max-w-7xl px-6">
        {/* HEADER */}
        <div className="admin-page-header mb-8 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-600">ADMIN PANEL</p>

            <h1 className="mt-2 text-3xl font-bold">Appointment Management</h1>

            <p className="mt-2 text-gray-600">
              View and manage patient appointment requests.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/management")}
              className="interactive-button rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
            >
              Management
            </button>

            <button
              onClick={handleLogout}
              className="interactive-button rounded-lg bg-white px-4 py-2 font-semibold text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>

        {logoutError && (
          <p role="alert" className="mb-6 rounded-lg bg-red-50 p-3 text-red-700">
            {logoutError}
          </p>
        )}

        <div className="admin-stats-grid mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="admin-metric-card rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Loaded</p>

            <h2 className="mt-2 text-3xl font-bold">{totalAppointments}</h2>
          </div>

          <div className="admin-metric-card rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>

            <h2 className="mt-2 text-3xl font-bold">{pendingAppointments}</h2>
          </div>

          <div className="admin-metric-card rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Confirmed</p>

            <h2 className="mt-2 text-3xl font-bold">{confirmedAppointments}</h2>
          </div>

          <div className="admin-metric-card rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Cancelled</p>

            <h2 className="mt-2 text-3xl font-bold">{cancelledAppointments}</h2>
          </div>

          <div className="admin-metric-card rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Completed</p>

            <h2 className="mt-2 text-3xl font-bold">{completedAppointments}</h2>
          </div>
        </div>

        <div className="admin-toolbar mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search appointment, patient, mobile or doctor"
            className="flex-1 rounded-xl border bg-white px-4 py-3 outline-none focus:border-blue-600"
          />

          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="rounded-xl border bg-white px-4 py-3 outline-none focus:border-blue-600"
          />

          <button
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setStatusFilter("ALL");
            }}
            className="rounded-xl bg-gray-200 px-5 py-3 font-semibold hover:bg-gray-300"
          >
            Clear
          </button>
        </div>

        {/* STATUS FILTERS */}
        <div className="admin-status-filters mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
                className={`admin-filter-pill rounded-lg px-4 py-2 font-semibold ${
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

        {/* APPOINTMENT TABLE */}
        <div className="admin-table-shell overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="admin-table">
            <colgroup>
              <col style={{ width: "150px" }} />
              <col style={{ width: "210px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "190px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "380px" }} />
            </colgroup>
            <thead className="admin-table-head">
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
                <tr key={appointment.id} className="admin-table-row border-t">
                  {/* APPOINTMENT NUMBER */}
                  <td className="px-4 py-4 font-semibold">
                    {appointment.appointmentNumber}
                  </td>

                  {/* PATIENT */}
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

                  {/* DOCTOR */}
                  <td className="px-4 py-4">
                    <p>{appointment.doctor.name}</p>

                    <p className="text-sm text-gray-500">
                      {appointment.doctor.specialization}
                    </p>
                  </td>

                  {/* DATE */}
                  <td className="px-4 py-4">{appointment.appointmentDate}</td>

                  {/* TIME */}
                  <td className="px-4 py-4">{appointment.preferredTime}</td>

                  {/* REASON */}
                  <td className="px-4 py-4">{appointment.reason || "—"}</td>

                  {/* ADMIN NOTE */}
                  <td className="px-4 py-4">
                    {appointment.adminNote ? (
                      <p className="max-w-xs text-sm text-gray-600">
                        {appointment.adminNote}
                      </p>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                        appointment.status,
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="px-4 py-4">
                    <div className="min-w-[280px] space-y-2">
                      {/* ADMIN NOTE INPUT */}
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

                      {/* ACTION BUTTONS */}
                      <div className="flex flex-wrap gap-2">
                        {/* PENDING */}
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

                        {/* RESCHEDULE */}
                        {["PENDING", "CONFIRMED"].includes(
                          appointment.status,
                        ) && (
                          <button
                            onClick={() => {
                              setRescheduleId(appointment.id);

                              setRescheduleData({
                                appointmentDate: appointment.appointmentDate,
                                preferredTime: appointment.preferredTime,
                              });
                            }}
                            disabled={updating || rescheduling}
                            className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:bg-gray-400"
                          >
                            Reschedule
                          </button>
                        )}

                        {/* COMPLETED */}
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

                      {/* RESCHEDULE FORM */}
                      {rescheduleId === appointment.id && (
                        <div className="mt-3 rounded-lg bg-orange-50 p-3">
                          <p className="mb-2 text-sm font-semibold text-orange-700">
                            Reschedule Appointment
                          </p>

                          <div className="space-y-2">
                            <input
                              type="date"
                              value={rescheduleData.appointmentDate}
                              onChange={(event) =>
                                setRescheduleData((previous) => ({
                                  ...previous,
                                  appointmentDate: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border px-3 py-2"
                            />

                            <input
                              type="time"
                              value={rescheduleData.preferredTime}
                              onChange={(event) =>
                                setRescheduleData((previous) => ({
                                  ...previous,
                                  preferredTime: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border px-3 py-2"
                            />

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReschedule(appointment.id)}
                                disabled={
                                  !rescheduleData.appointmentDate ||
                                  !rescheduleData.preferredTime ||
                                  rescheduling
                                }
                                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-gray-400"
                              >
                                {rescheduling ? "Saving..." : "Save"}
                              </button>

                              <button
                                onClick={() => {
                                  setRescheduleId(null);

                                  setRescheduleData({
                                    appointmentDate: "",
                                    preferredTime: "",
                                  });
                                }}
                                className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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

          {hasMore && appointments.length > 0 && appointments.length % 100 === 0 && (
            <div className="border-t p-5 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loadingMore ? "Loading..." : "Load more appointments"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminAppointments;
