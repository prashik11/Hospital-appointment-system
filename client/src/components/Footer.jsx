function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 py-10 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="" className="h-12 w-12 rounded-full" />
              <h3 className="text-xl font-bold">Shree Pharma and Clinic</h3>
            </div>

            <p className="mt-3 text-gray-400">
              Quality healthcare for you and your family.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Contact</h3>

            <p className="mt-3 text-gray-400">Phone: +91 7218979098</p>

            <p className="text-gray-400">Email: shreeclinic6210@gmail.com</p>
          </div>

          <div>
            <h3 className="font-semibold">Address</h3>

            <p className="mt-3 text-gray-400">
              Shree Pharma and Clinic
              <br />
              Bhigwan MH, India
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
          © 2026 Shree Pharma and Clinic. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
