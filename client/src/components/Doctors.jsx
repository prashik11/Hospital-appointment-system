import { doctorProfiles } from "../data/doctors";

function initials(name) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Doctors() {
  return (
    <section id="doctors" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="font-semibold text-blue-600">OUR DOCTORS</p>
          <h2 className="mt-2 text-3xl font-bold">Meet Our Doctors</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Explore our doctors’ qualifications and areas of care.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctorProfiles.map((doctor) => (
            <article key={doctor.name} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-4 bg-blue-50 p-6">
                <div
                  aria-label={`${doctor.name} photo placeholder`}
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-teal-700 text-xl font-bold text-white shadow-sm"
                >
                  {initials(doctor.name)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                  <p className="mt-1 text-sm font-medium text-blue-700">{doctor.specialization}</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600">{doctor.qualification}</p>
                {doctor.services.length > 0 && (
                  <>
                    <h4 className="mt-5 text-sm font-semibold text-gray-900">Areas of care</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                      {doctor.services.map((service) => <li key={service}>• {service}</li>)}
                    </ul>
                  </>
                )}
                <a
                  href={`/appointment?doctor=${encodeURIComponent(doctor.name)}`}
                  className="mt-6 inline-flex font-semibold text-blue-700 hover:text-blue-900"
                >
                  Book appointment <span aria-hidden="true" className="ml-1">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Doctors;
