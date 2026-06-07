// src/components/AnalyticsTracker.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageView } from "../utils/analytics";

export default function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    pageView(location.pathname);
  }, [location.pathname]);
  return null;
}
