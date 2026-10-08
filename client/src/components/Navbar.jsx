function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <a href="/" className="flex items-center gap-3" aria-label="Shree Pharma and Clinic home">
          <img src="/logo.svg" alt="" className="h-14 w-14" />
          <span>
            <span className="block text-lg font-bold text-blue-700 sm:text-2xl">Shree Pharma and Clinic</span>
            <span className="block text-sm text-gray-500">Quality Care, Better Life</span>
          </span>
        </a>

        <div className="hidden gap-6 md:flex">
          <a
            href="/#home"
            className="text-gray-700 hover:text-blue-700"
          >
            Home
          </a>

          <a
            href="/#services"
            className="text-gray-700 hover:text-blue-700"
          >
            Services
          </a>

          <a href="/#doctors" className="text-gray-700 hover:text-blue-700">
            Doctors
          </a>

          <a
            href="/#departments"
            className="text-gray-700 hover:text-blue-700"
          >
            Departments
          </a>

          <a
            href="/#contact"
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
