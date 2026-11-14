package com.motherson.medislot.controller;

import com.motherson.medislot.dto.Dtos.*;
import com.motherson.medislot.security.AuthUser;
import com.motherson.medislot.service.*;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

/** Everything an employee (role EMPLOYEE) can do. */
@RestController
public class EmployeeController {
    private final HospitalService hospitals;
    private final DoctorService doctors;
    private final SlotService slots;
    private final AppointmentService appointments;
    private final EmployeeService employees;
    private final com.motherson.medislot.repository.DepartmentRepository departments;
    private final ImageStorageService images;

    public EmployeeController(HospitalService hospitals, DoctorService doctors, SlotService slots,
                              AppointmentService appointments, EmployeeService employees,
                              com.motherson.medislot.repository.DepartmentRepository departments,
                              ImageStorageService images) {
        this.hospitals = hospitals;
        this.doctors = doctors;
        this.slots = slots;
        this.appointments = appointments;
        this.employees = employees;
        this.departments = departments;
        this.images = images;
    }

    // ----- hospitals -----
    @GetMapping("/hospitals")
    public List<HospitalDto> hospitals(@RequestParam(required = false) String name,
                                       @RequestParam(required = false) String city) {
        return hospitals.search(name, city);
    }

    @GetMapping("/hospitals/{id}")
    public HospitalDetailDto hospital(@PathVariable Long id) {
        return hospitals.detail(id);
    }

    @GetMapping("/departments")
    public List<DepartmentDto> departments() {
        return departments.findAllByOrderByNameAsc().stream().map(Mapper::department).toList();
    }

    // ----- doctors & slots -----
    @GetMapping("/doctors")
    public List<DoctorDto> doctors(@RequestParam(required = false) Long hospitalId,
                                   @RequestParam(required = false) Long departmentId,
                                   @RequestParam(required = false) String name,
                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                   @RequestParam(defaultValue = "false") boolean onlyAvailable) {
        return doctors.search(hospitalId, departmentId, name, date, onlyAvailable);
    }

    @GetMapping("/doctors/{id}")
    public DoctorDto doctor(@PathVariable Long id) {
        return doctors.detail(id);
    }

    @GetMapping("/doctors/{id}/slots")
    public List<SlotDto> slots(@PathVariable Long id,
                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return slots.openSlots(id, date);
    }

    // ----- appointments -----
    @PostMapping("/appointments")
    public AppointmentDto book(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody BookRequest request) {
        return appointments.book(user, request);
    }

    @GetMapping("/appointments/my")
    public List<AppointmentDto> my(@AuthenticationPrincipal AuthUser user,
                                   @RequestParam(defaultValue = "upcoming") String status) {
        return appointments.mine(user, status);
    }

    @GetMapping("/appointments/{id}")
    public AppointmentDto appointment(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return appointments.getMine(user, id);
    }

    @PutMapping("/appointments/{id}/cancel")
    public AppointmentDto cancel(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
                                 @Valid @RequestBody(required = false) CancelRequest request) {
        return appointments.cancelMine(user, id, request == null ? null : request.reason());
    }

    // ----- profile -----
    @GetMapping("/employees/me")
    public EmployeeDto me(@AuthenticationPrincipal AuthUser user) {
        return employees.me(user);
    }

    @PutMapping("/employees/me")
    public EmployeeDto updateMe(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody EmployeeUpdateRequest request) {
        return employees.update(user, request);
    }

    // ----- profile photo (upload first, then save the returned URL) -----
    @PostMapping(value = "/employees/uploads/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageUploadDto uploadProfileImage(@RequestParam("file") MultipartFile file) {
        return new ImageUploadDto(images.upload(file, "medislot/employees"));
    }

    @PutMapping("/employees/me/image")
    public EmployeeDto setProfileImage(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody ImageUrlRequest request) {
        return employees.updateImage(user, request.imageUrl());
    }
}
