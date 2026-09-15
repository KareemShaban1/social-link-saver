import { useLayoutEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { capturePendingShareFromLocation } from "@/lib/pendingShare";

/** Captures share-target / bookmarklet query params during SPA navigations. */
export function ShareInboundCapture() {
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const shouldRedirect = capturePendingShareFromLocation(location.pathname, location.search);
    if (!shouldRedirect && !location.search) return;

    if (location.pathname === "/share-target" || (location.pathname === "/" && shouldRedirect)) {
      navigate("/app", { replace: true });
      return;
    }

    if (shouldRedirect && location.search) {
      navigate({ pathname: location.pathname, search: "" }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return null;
}

export function ShareTargetRedirect() {
  return <Navigate to="/app" replace />;
}
