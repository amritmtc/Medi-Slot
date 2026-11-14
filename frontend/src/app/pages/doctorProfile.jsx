import React, { useEffect, useState } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import { api } from "../../api";
import { mapDoctor } from "../data/mockData";
import { Avatar, Btn } from "../components/ui";
import { EmployeeLayout } from "../components/navigation";

export function Doctor({ setPage }) {
  const doctorId = sessionStorage.getItem("medi-slot-doctor-id");
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId) { setPage("doctors"); return; }
    api.doctor(doctorId).then((data) => setDoctor(mapDoctor(data))).catch((e) => setError(e.message));
  }, [doctorId, setPage]);

  if (!doctor) {
    return (
      <EmployeeLayout page="doctor" setPage={setPage}>
        <button className="back" onClick={() => setPage("doctors")}>
          <ChevronLeft size={16} />
          Back to Doctors
        </button>
        {error ? <p className="login-error">{error}</p> : <p className="muted">Loading doctor profile…</p>}
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout page="doctor" setPage={setPage}>
      <button className="back" onClick={() => setPage("doctors")}>
        <ChevronLeft size={16} />
        Back to Doctors
      </button>
      <section className="profile-hero">
        <Avatar doctor={doctor} size="large" />
        <div>
          <h2>{doctor.name}</h2>
          <p>{doctor.specialty}</p>
          <p className="details">
            {doctor.qualification ? `${doctor.qualification} · ` : ""}{doctor.experience}
          </p>
          <p className="details">
            <MapPin size={14} />
            {doctor.hospital}
          </p>
        </div>
      </section>
      <section className="doctor-detail">
        <h3>About Doctor</h3>
        <p>{doctor.about || `${doctor.name} is a ${doctor.specialty.toLowerCase()} at ${doctor.hospital}.`}</p>
        <Btn onClick={() => setPage("slots")}>Book an Appointment</Btn>
      </section>
    </EmployeeLayout>
  );
}
