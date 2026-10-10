import { useQuery } from "@apollo/client/react";
import { GET_DEPARTMENTS } from "../graphql/queries";
import Reveal from "./Reveal";

function Departments() {
  const { loading, error, data } = useQuery(GET_DEPARTMENTS);
  const departments = data?.departments || [];

  return (
    <section id="departments" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="department-heading text-center">
          <p className="font-semibold text-blue-600">DEPARTMENTS</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Our Medical Departments
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Explore the specialties available at Shree Pharma and Clinic.
          </p>
        </Reveal>

        {loading && (
          <p className="mt-10 text-center text-gray-500" role="status">
            Loading departments...
          </p>
        )}

        {error && (
          <p className="mt-10 text-center text-red-600" role="alert">
            Unable to load departments.
          </p>
        )}

        {!loading && !error && departments.length === 0 && (
          <p className="mt-10 text-center text-gray-500">
            Department information will be available soon.
          </p>
        )}

        {!loading && !error && departments.length > 0 && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department, index) => (
              <Reveal
                key={department.id}
                as="article"
                delay={(index % 3) * 110}
                className="department-simple-card rounded-xl border bg-white p-6 shadow-sm"
              >
                <div className="department-accent mb-4 h-1 w-10 rounded-full bg-gradient-to-r from-blue-600 to-teal-500" />
                <h3 className="text-lg font-bold text-gray-900">
                  {department.name}
                </h3>
                {department.description && (
                  <p className="mt-2 leading-6 text-gray-600">
                    {department.description}
                  </p>
                )}
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Departments;
