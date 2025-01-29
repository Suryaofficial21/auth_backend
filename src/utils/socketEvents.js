export const SOCKET_EVENTS = {
  // Connection events
  JOIN_ADMIN_ROOM: "joinAdminRoom",
  USER_EVENT: "userEvent",
  USER_UPDATE: "userUpdate",

  // User events
  USER_REGISTERED: "userRegistered",
  USER_VERIFIED: "userVerified",
  USER_ROLE_UPDATED: "userRoleUpdated",
  USER_STATUS_UPDATED: "userStatusUpdated",
  USER_PASSWORD_RESET: "userPasswordReset",

  // Error events
  ERROR: "error",
}

export const emitUserEvent =async (io, eventType, data) => {
  io.to("admins").emit(SOCKET_EVENTS.USER_UPDATE, {
    type: eventType,
    data,
    timestamp: new Date(),
  })
}

