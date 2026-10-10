import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";

import { LOGIN_ADMIN } from "../graphql/mutations";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loginAdmin, { loading, error }] = useMutation(LOGIN_ADMIN);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await loginAdmin({
        variables: {
          email: formData.email,
          password: formData.password,
        },
      });

      // Remove credentials written by older builds before switching to cookies.
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");

      navigate("/admin/appointments");
    } catch (error) {
      console.error("Admin login failed:", error);
    }
  };

  return (
    <main className="admin-login-page flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="admin-login-card w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
        <div className="text-center">
          <div className="admin-login-logo mx-auto mb-5 grid h-24 w-24 place-items-center rounded-3xl">
            <img src="/logo.svg" alt="Shree Pharma and Clinic logo" className="h-20 w-20" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-blue-700">
            Shree Pharma and Clinic
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Admin Login
          </h1>

          <p className="mt-2 text-gray-600">Sign in to manage appointments</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-gray-700">
              Email address
            </label>

            <input
              id="admin-email"
              type="email"
              name="email"
              autoComplete="username"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter admin email"
              required
              className="admin-login-input w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-gray-700">
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              className="admin-login-input w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {error.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="interactive-button mt-1 w-full rounded-xl bg-blue-700 px-6 py-3.5 font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-gray-100 pt-5 text-sm">
          <span className="text-gray-500">Authorized staff only</span>
          <a href="/" className="font-semibold text-blue-700 transition-colors hover:text-blue-900">
            Back to home
          </a>
        </div>
      </div>
    </main>
  );
}

export default AdminLogin;
