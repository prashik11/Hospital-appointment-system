function Hero() {
  return (
    <section
      id="home"
      className="bg-blue-50"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2">

        <div>
          <p className="mb-3 font-semibold text-blue-600">
            YOUR HEALTH, OUR PRIORITY
          </p>

          <h2 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Quality Healthcare
            <br />
            You Can Trust
          </h2>

          <p className="mt-6 max-w-xl text-lg text-gray-600">
            Get access to experienced doctors and
            reliable healthcare services at CityCare Hospital.
          </p>

          <a
            href="/appointment"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Book an Appointment
          </a>
        </div>

        <div className="rounded-2xl bg-white p-10 shadow-lg">
          <div className="text-center">

            <div className="text-6xl">
              🏥
            </div>

            <h3 className="mt-5 text-2xl font-bold">
              CityCare Hospital
            </h3>

            <p className="mt-3 text-gray-600">
              Caring for you and your family with
              compassion and modern healthcare.
            </p>

          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;