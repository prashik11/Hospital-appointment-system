import { gql } from "@apollo/client";

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment(
    $name: String!
    $mobile: String!
    $age: Int!
    $gender: String!
    $departmentId: ID!
    $doctorId: ID!
    $appointmentDate: String!
    $preferredTime: String!
    $reason: String
  ) {
    createAppointment(
      name: $name
      mobile: $mobile
      age: $age
      gender: $gender
      departmentId: $departmentId
      doctorId: $doctorId
      appointmentDate: $appointmentDate
      preferredTime: $preferredTime
      reason: $reason
    ) {
      appointmentNumber
      appointmentDate
      preferredTime
      reason
      status

      patient {
        name
        mobile
        age
        gender
      }

      doctor {
        name
        specialization
      }

      department {
        name
      }
    }
  }
`;

export const UPDATE_APPOINTMENT_STATUS = gql`
  mutation UpdateAppointmentStatus(
    $appointmentId: ID!
    $status: AppointmentStatus!
    $adminNote: String
  ) {
    updateAppointmentStatus(
      appointmentId: $appointmentId
      status: $status
      adminNote: $adminNote
    ) {
      id
      appointmentNumber
      status
      adminNote
    }
  }
`;

export const LOGIN_ADMIN = gql`
  mutation LoginAdmin($email: String!, $password: String!) {
    loginAdmin(email: $email, password: $password) {
      admin {
        id
        name
        email
        role
      }
    }
  }
`;

export const LOGOUT_ADMIN = gql`
  mutation LogoutAdmin {
    logoutAdmin
  }
`;

export const CHANGE_ADMIN_PASSWORD = gql`
  mutation ChangeAdminPassword($currentPassword: String!, $newPassword: String!) {
    changeAdminPassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

export const UPDATE_APPOINTMENT_SCHEDULE = gql`
  mutation UpdateAppointmentSchedule(
    $appointmentId: ID!
    $appointmentDate: String!
    $preferredTime: String!
    $adminNote: String
  ) {
    updateAppointmentSchedule(
      appointmentId: $appointmentId
      appointmentDate: $appointmentDate
      preferredTime: $preferredTime
      adminNote: $adminNote
    ) {
      id
      appointmentNumber
      appointmentDate
      preferredTime
      status
      adminNote
    }
  }
`;

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($name: String!, $description: String) {
    createDepartment(name: $name, description: $description) {
      id
      name
      description
      isActive
    }
  }
`;

export const CREATE_DOCTOR = gql`
  mutation CreateDoctor(
    $name: String!
    $qualification: String
    $specialization: String!
    $image: String
    $services: [String!]
    $availability: DoctorAvailabilityInput
    $departmentId: ID!
    $consultationFee: Float
  ) {
    createDoctor(
      name: $name
      qualification: $qualification
      specialization: $specialization
      image: $image
      services: $services
      availability: $availability
      departmentId: $departmentId
      consultationFee: $consultationFee
    ) {
      id
      name
      qualification
      specialization
      image
      services
      availability {
        days
        startTime
        endTime
      }
      departmentId
      consultationFee
      isActive
    }
  }
`;

export const UPDATE_DOCTOR_AVAILABILITY = gql`
  mutation UpdateDoctorAvailability($doctorId: ID!, $availability: DoctorAvailabilityInput!) {
    updateDoctorAvailability(doctorId: $doctorId, availability: $availability) {
      id
      availability {
        days
        startTime
        endTime
      }
    }
  }
`;
