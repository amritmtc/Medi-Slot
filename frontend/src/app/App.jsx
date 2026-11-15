import React, { useCallback, useEffect, useReducer, useState } from "react";
import "../styles.css";
import {
  Home,
  Login,
  Signup,
  Hospitals,
  Doctors,
  HospitalExplore,
  Slots,
  Confirmation,
  Appointments,
  Profile,
} from "./pages/employeePages";
import { Doctor } from "./pages/doctorProfile";
import {
  AdminDashboard,
  AdminDoctors,
  Schedule,
  AddDoctor,
  HospitalProfile,
  Reports,
  AdminSettings,
  SuperAdminDashboard,
} from "./pages/adminPages";

// The current page lives in the URL hash (#/slots), so refreshing the browser or pressing Back / Forward
// keeps the visitor where they are instead of dropping them on the landing page.
const readHash = () => window.location.hash.replace(/^#\/?/, "");

export default function App() {
  const [page, setRoute] = useState(() => readHash() || "home");
  const [, refresh] = useReducer((n) => n + 1, 0);
  // Always re-render on navigation, even to the same page (e.g. logging out while on "home").
  // {replace: true} swaps the current history entry (used after log in / log out so Back does not return to them).
  const setPage = useCallback((next, { replace = false } = {}) => {
    if (readHash() !== next) {
      if (replace) window.history.replaceState(null, "", `#/${next}`);
      else window.history.pushState(null, "", `#/${next}`);
    }
    setRoute(next);
    refresh();
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const onHistory = () => { setRoute(readHash() || "home"); refresh(); window.scrollTo(0, 0); };
    window.addEventListener("popstate", onHistory);
    return () => window.removeEventListener("popstate", onHistory);
  }, []);
  const isAuthenticated = Boolean(sessionStorage.getItem("medi-slot-token"));
  const role = sessionStorage.getItem("medi-slot-role"); // employee | admin | superAdmin
  const pages = {
    home: <Home setPage={setPage} isAuthenticated={isAuthenticated} />,
    login: <Login setPage={setPage} />,
    signup: <Signup setPage={setPage} />,
    hospitals: <Hospitals setPage={setPage} />,
    hospitalExplore: <HospitalExplore setPage={setPage} />,
    doctors: <Doctors setPage={setPage} />,
    doctor: <Doctor setPage={setPage} />,
    slots: <Slots setPage={setPage} />,
    confirmation: <Confirmation setPage={setPage} />,
    appointments: <Appointments setPage={setPage} />,
    profile: <Profile setPage={setPage} />,
    admin: <AdminDashboard setPage={setPage} />,
    adminDoctors: <AdminDoctors setPage={setPage} />,
    addDoctor: <AddDoctor setPage={setPage} />,
    schedule: <Schedule setPage={setPage} />,
    hospitalProfile: <HospitalProfile setPage={setPage} />,
    reports: <Reports setPage={setPage} />,
    settings: <AdminSettings setPage={setPage} />,
    superAdmin: <SuperAdminDashboard setPage={setPage} />,
  };
  // Route guard: every portal page is only reachable with the matching role,
  // otherwise the visitor is sent to the login screen.
  const employeePages = ["hospitals", "hospitalExplore", "doctors", "doctor", "slots", "confirmation", "appointments", "profile"];
  const adminPages = ["admin", "adminDoctors", "addDoctor", "schedule", "adminAppointments", "hospitalProfile", "reports", "settings"];
  const home = role === "admin" ? "admin" : role === "superAdmin" ? "superAdmin" : role === "employee" ? "hospitals" : "home";
  let current = pages[page] ? page : home;
  if (employeePages.includes(current) && role !== "employee") current = "login";
  if (adminPages.includes(current) && role !== "admin") current = "login";
  if (current === "superAdmin" && role !== "superAdmin") current = "login";
  // a signed-in user pressing Back onto the log in / sign up screens goes to their own dashboard instead
  if ((current === "login" || current === "signup") && role) current = home;
  // keep the address bar in step when the guard redirected (without adding history entries)
  useEffect(() => {
    if (readHash() !== current) window.history.replaceState(null, "", `#/${current}`);
  });
  return (
    <>
      {pages[current]}
    </>
  );
}
