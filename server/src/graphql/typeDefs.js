const typeDefs = `#graphql

  type Department {
    id: ID!
    name: String!
    description: String
    isActive: Boolean!
  }

  type Doctor {
    id: ID!
    name: String!
    qualification: String
    specialization: String!
    departmentId: ID!
    consultationFee: Float!
    isActive: Boolean!
  }

   type Patient {
    id: ID!
    name: String!
    mobile: String!
    age: Int!
    gender: String!
    createdAt: String!
    updatedAt: String!
  }

  enum AppointmentStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
  }

  type Appointment {
    id: ID!
    appointmentNumber: String!
    patient: Patient!
    doctor: Doctor!
    department: Department!
    appointmentDate: String!
    preferredTime: String!
    reason: String
    status: AppointmentStatus!
    adminNote: String
    createdAt: String!
    updatedAt: String!
  }

  type Admin {
  id: ID!
  name: String!
  email: String!
  role: String!
}

type LoginResponse {
  token: String!
  admin: Admin!
}

  type Query {
    hello: String
    departments: [Department!]!
    doctors: [Doctor!]!
    appointments: [Appointment!]!
  }

  type Mutation {

  loginAdmin(
  email: String!
  password: String!
): LoginResponse!

    createDepartment(
      name: String!
      description: String
    ): Department!

    createDoctor(
      name: String!
      qualification: String
      specialization: String!
      departmentId: ID!
      consultationFee: Float
    ): Doctor!

    createAppointment(
      name: String!
      mobile: String!
      age: Int!
      gender: String!
      departmentId: ID!
      doctorId: ID!
      appointmentDate: String!
      preferredTime: String!
      reason: String
    ): Appointment!

    updateAppointmentStatus(
  appointmentId: ID!
  status: AppointmentStatus!
  adminNote: String
): Appointment!
  }
`;

module.exports = typeDefs;
