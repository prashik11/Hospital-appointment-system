import { useQuery } from "@apollo/client/react";
import { GET_DEPARTMENTS } from "../graphql/queries";

function Departments() {
  const {
    loading,
    error,
    data,
  } = useQuery(GET_DEPARTMENTS);

  return (
    <section
      id="departments"
      className="bg-gray-50 py-20"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">
          <p className="font-semibold text-blue-600">
            DEPARTMENTS
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Our Medical Departments
          </h2>
        </div>

        {loading && (
          <p className="mt-10 text-center">
            Loading departments...
          </p>
        )}

        {error && (
          <p className="mt-10 text-center text-red-600">
            Unable to load departments.
          </p>
        )}

        {!loading && !error && (
          <div className="mt-12 grid gap-6 md:grid-cols-3">

            {data.departments.map((department) => (
              <div
                key={department.id}
                className="rounded-xl bg-white p-7 shadow-sm"
              >
                <h3 className="text-xl font-bold">
                  {department.name}
                </h3>

                <p className="mt-3 text-gray-600">
                  {department.description}
                </p>
              </div>
            ))}

          </div>
        )}

      </div>
    </section>
  );
}

export default Departments;
