import { Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_CURRENT_ADMIN } from "../graphql/queries";

function ProtectedRoute({ children }) {
  const { loading, data, error } = useQuery(GET_CURRENT_ADMIN, {
    fetchPolicy: "network-only",
  });

  if (loading) {
    return <div className="p-10 text-center">Checking admin session...</div>;
  }

  if (error || !data?.me) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
