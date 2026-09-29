import { gql } from "@apollo/client";

export const GET_DEPARTMENTS = gql`
  query GetDepartments {
    departments {
      id
      name
      description
      isActive
    }
  }
`;

export const GET_DOCTORS = gql`
  query GetDoctors {
    doctors {
      id
      name
      qualification
      specialization
      departmentId
      consultationFee
      isActive
    }
  }
`;

export const GET_APPOINTMENTS = gql`
  query GetAppointments {
    appointments {
      id
      appointmentNumber
      appointmentDate
      preferredTime
      reason
      status
      adminNote

      patient {
        id
        name
        mobile
        age
        gender
      }

      doctor {
        id
        name
        qualification
        specialization
      }

      department {
        id
        name
      }
    }
  }
`;