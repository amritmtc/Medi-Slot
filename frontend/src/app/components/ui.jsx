import React from "react";
import { Activity } from "lucide-react";

export function Logo({ admin = false, dark = false, onHome }) {
  return (
    <button
      type="button"
      className={"logo" + (dark ? " on-dark" : "")}
      onClick={onHome}
      aria-label="MediSlot home"
    >
      <span className="logo-mark">
        <Activity strokeWidth={2.4} />
      </span>
      <span className="logo-word">
        Medi<b>Slot</b>
      </span>
      {admin && <small>Admin</small>}
    </button>
  );
}
export function Avatar({ doctor, size = "" }) {
  return (
    <div className={"avatar " + size}>
      {doctor?.image ? (
        <img className="avatar-img" src={doctor.image} alt={doctor.name || ""} />
      ) : (
        doctor?.initial || "MS"
      )}
    </div>
  );
}
export function Btn({ children, onClick, kind = "", className = "", ...props }) {
  return (
    <button onClick={onClick} className={"btn " + kind + " " + className} {...props}>
      {children}
    </button>
  );
}

/** Bookings are confirmed immediately (there is no approval step), so old "BOOKED" rows read as Confirmed. */
export const statusLabel = (status) => (status === "BOOKED" ? "Confirmed" : status === "NO_SHOW" ? "No show" : (status || "").charAt(0) + (status || "").slice(1).toLowerCase());
export const statusTone = (status) =>
  status === "CANCELLED" ? "red" : status === "NO_SHOW" ? "yellow" : status === "COMPLETED" ? "blue" : "green";
