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
      token

      admin {
        id
        name
        email
        role
      }
    }
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
