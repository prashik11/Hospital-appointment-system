function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <div>
          <h1 className="text-2xl font-bold text-blue-700">
            CityCare Hospital
          </h1>

          <p className="text-sm text-gray-500">
            Quality Care, Better Life
          </p>
        </div>

        <div className="hidden gap-6 md:flex">
          <a
            href="#home"
            className="text-gray-700 hover:text-blue-700"
          >
            Home
          </a>

          <a
            href="#services"
            className="text-gray-700 hover:text-blue-700"
          >
            Services
          </a>

          <a
            href="#departments"
            className="text-gray-700 hover:text-blue-700"
          >
            Departments
          </a>

          <a
            href="#contact"
            className="text-gray-700 hover:text-blue-700"
          >
            Contact
          </a>
        </div>

        <a
          href="/appointment"
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Book Appointment
        </a>

      </div>
    </nav>
  );
}

export default Navbar;