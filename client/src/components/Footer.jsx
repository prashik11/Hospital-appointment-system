function Footer() {
  return (
    <footer
      id="contact"
      className="bg-gray-900 py-10 text-white"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="grid gap-8 md:grid-cols-3">

          <div>
            <h3 className="text-xl font-bold">
              CityCare Hospital
            </h3>

            <p className="mt-3 text-gray-400">
              Quality healthcare for you and your family.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">
              Contact
            </h3>

            <p className="mt-3 text-gray-400">
              Phone: +91 98765 43210
            </p>

            <p className="text-gray-400">
              Email: info@citycarehospital.com
            </p>
          </div>

          <div>
            <h3 className="font-semibold">
              Address
            </h3>

            <p className="mt-3 text-gray-400">
              CityCare Hospital
              <br />
              Your City, India
            </p>
          </div>

        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
          © 2026 CityCare Hospital. All rights reserved.
        </div>

      </div>
    </footer>
  );
}

export default Footer;