import { useState } from "react";
import { useLocation } from "react-router-dom";

const navLinks = [
  ["Home", "/#home"],
  ["Services", "/#services"],
  ["Doctors", "/#doctors"],
  ["Departments", "/#departments"],
  ["Contact", "/#contact"],
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="site-navbar sticky top-0 z-50 border-b border-blue-50/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="site-navbar-inner mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <a
          href="/"
          className="site-brand flex min-w-0 items-center gap-2 sm:gap-3"
          aria-label="Shree Pharma and Clinic home"
          onClick={closeMenu}
        >
          <img src="/logo.svg" alt="" className="site-brand-logo" />
          <span className="min-w-0">
            <span className="site-brand-name block font-bold text-blue-700">
              Shree Pharma and Clinic
            </span>
            <span className="site-brand-tagline hidden text-sm text-gray-500 sm:block">Quality Care, Better Life</span>
          </span>
        </a>

        <div className="site-nav-links hidden items-center gap-6 lg:flex">
          {navLinks.map(([label, href]) => (
            <a key={label} href={href} className="nav-link text-gray-700 hover:text-blue-700">
              {label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isHomePage && (
            <a
              href="/admin/login"
              className="home-nav-action admin-nav-button hidden whitespace-nowrap rounded-lg border border-blue-200 font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 lg:inline-flex"
            >
              Admin Login
            </a>
          )}
          <a
            href="/appointment"
            className="home-nav-action site-book-button interactive-button whitespace-nowrap rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700"
          >
            Book Appointment
          </a>
          <button
            type="button"
            className="menu-toggle rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-navigation" className="mobile-menu border-t border-gray-100 bg-white px-4 py-2 lg:hidden">
          {navLinks.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              onClick={closeMenu}
            >
              {label}
            </a>
          ))}
          {isHomePage && (
            <a
              href="/admin/login"
              className="block rounded-lg px-3 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              onClick={closeMenu}
            >
              Admin Login
            </a>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
