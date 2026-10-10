import Reveal from "./Reveal";

function Services() {
  const services = [
    {
      title: "Weekly OPD",
      description:
        "Consult experienced doctors through our outpatient department.",
    },
    {
      title: "IPD",
      description:
        "Quality inpatient care with trained medical staff.",
    },
    {
      title: "24/7 Medical Care",
      description:
        "Medical assistance available around the clock.",
    },
  ];

  return (
    <section
      id="services"
      className="bg-white py-20"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">
          <p className="font-semibold text-blue-600">
            OUR SERVICES
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Healthcare Services
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">

          {services.map((service, index) => (
            <Reveal
              key={service.title}
              as="article"
              delay={index * 90}
              className="card-lift rounded-xl border bg-white p-7 shadow-sm"
            >
              <h3 className="text-xl font-bold">
                {service.title}
              </h3>

              <p className="mt-3 text-gray-600">
                {service.description}
              </p>
            </Reveal>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Services;
