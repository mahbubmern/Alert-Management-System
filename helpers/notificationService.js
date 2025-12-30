// // services/notificationService.js
// import Notification from "../models/alertNotificationModel.js";

// export const createOrUpdateAndEmitNotification = async (
//   io,
//   { title, message, type, createdBy, alertId, targetRoles = [] }
// ) => {
//   let notification = await Notification.findOne({ alertId });

//   if (notification) {
//     notification.title = title;
//     notification.message = message;
//     notification.type = type;
//     notification.createdBy = createdBy;
//     await notification.save();
//   } else {
//     notification = new Notification({
//       title,
//       message,
//       type,
//       createdBy,
//       alertId,
//     });
//     await notification.save();
//   }

//   // 🔁 Emit to specific rooms (roles)
//   targetRoles.forEach((role) => {
//     io.to(role).emit("receive_notification", {
//       _id: notification._id,
//       title: notification.title,
//       message: notification.message,
//       type: notification.type,
//       createdBy: notification.createdBy,
//       alertId: notification.alertId,
//       createdAt: notification.createdAt,
//       updatedAt: notification.updatedAt,
//     });
//   });
// };

// export const getTargetRolesForEscalation = (alert, user, context = "") => {
//   const roles = [];

//   // 🔹 Default escalation
//   if (context === "default" && alert.status === "escalated") {
//     roles.push("Level_2");
//   }

//   // 🔹 Incident Declaration
//   if (
//     context === "incidentDeclaration" &&
//     user.role === "Level_2" &&
//     alert.status === "escalated" &&
//     alert.incidentDeclarationRequired === "yes"
//   ) {
//     roles.push("admin");
//   }

//   // 🔹 if  Incident Declared
//   if (
//     context === "isIncidenceTrue" &&
//     user.role === "admin" &&
//     alert.status === "escalated" &&
//     alert.incidentDeclarationRequired === "yes" &&
//     alert.isIncidence === "yes"
//   ) {
//     roles.push("Level_2");
//   }

//   // 🔹 Hand Back to L1
//   if (
//     context === "handBackToL1" &&
//     user.role === "Level_2" &&
//     alert.status === "escalated" &&
//     alert.handBackToL1Assignee === "yes"
//   ) {
//     if (
//       alert.incidentDeclarationRequired === "yes" &&
//       alert.isIncidence === "yes"
//     ) {
//       roles.push("Level_1", "admin");
//     } else {
//       roles.push("Level_1");
//     }
//   }

//   // 🔹 Closed by Level_1
//   if (
//     context === "closeByL1" &&
//     user.role === "Level_1" &&
//     alert.status === "closed" &&
//     alert.incidentDeclarationRequired === "yes" &&
//     alert.isIncidence === "yes" &&
//     alert.handBackToL1Assignee === "yes"
//   ) {
//     roles.push("Level_2", "admin");
//   }

//   return roles;
// };
