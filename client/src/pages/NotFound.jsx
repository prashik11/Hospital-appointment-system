import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="text-center">
        <p className="text-7xl font-bold text-blue-600">404</p>

        <h1 className="mt-4 text-3xl font-bold">Page Not Found</h1>

        <p className="mt-3 text-gray-600">
          The page you are looking for does not exist.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Go Home
        </button>
      </div>
    </main>
  );
}

export default NotFound;
