import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import { mongodbConnection } from "./config/mongodbConnection.js";
import userRoute from "./routes/userRoute.js";
import authRoute from "./routes/authRoute.js";
import vulnerabilityRoute from "./routes/vulnerabilityRoute.js";
import monitoringToolsRoute from "./routes/monitoringToolsRoute.js";
import alertRoute from "./routes/alertRoute.js";
import saveAlertRoute from "./routes/saveAlertRoute.js";
// import outgoingRoute from "./routes/outgoingRoute.js";
// import taskRoute from "./routes/taskRoute.js";
import userPassRoute from "./routes/userPassRoute.js";
import userPersonalRoute from "./routes/userPersonalRoute.js";
import userPhotoRoute from "./routes/userPhotoRoute.js";

// import departmentRoute from "./routes/departmentRoute.js";
// import categoryRoute from "./routes/categoryRoute.js";
// import fileFolderRoute from "./routes/fileFolderRoute.js";
// import uploadFileRoute from "./routes/uploadFileRoute.js";
import notificationRoute from "./routes/notificationRoute.js";
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import jwt from "jsonwebtoken";

import cors from "cors";
import path from "path";

// for real time chat and notification

import {
  clearNotification,
  handleSocketChatMessage,
  markAsReadChat,
} from "./controllers/alertController.js";
// import { handleSocketNotification } from "./controllers/alertController.js";

// for real-time communication
import { Server } from "socket.io";
import http from "http";
import Alert from "./models/alertModel.js";

dotenv.config();
// initialization
const app = express();

const server = http.createServer(app);

// Enable CORS for Socket.IO
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//     credentials: true
//   },
// });
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your frontend URL
    credentials: true, // allow cookies
  },
});

//  Make io available in all routes/controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return next(new Error("No cookies found"));

  const parsed = cookie.parse(cookieHeader);
  const token = parsed.accessToken;
  if (!token) return next(new Error("Access token not found"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_LOGIN_SECRET); // ✅ Must match login
    socket.user = decoded;
    console.log(`User with index ${decoded.index} connected`);
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message);
    next(new Error("Invalid token"));
  }
});

const __dirname = path.resolve();

//set PORT

const PORT = process.env.PORT || 9090;

// set Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

// Set Static Folder
app.use("/files", express.static(path.join(__dirname, "../Uploads/Alerts")));

// set Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/vulnerability", vulnerabilityRoute);
app.use("/api/v1/alert", alertRoute);
app.use("/api/v1/alert", saveAlertRoute);
// app.use("/api/v1/outgoing", outgoingRoute);
// app.use("/api/v1/task", taskRoute);
app.use("/api/v1/userpass", userPassRoute);
app.use("/api/v1/userpersonal", userPersonalRoute);
app.use("/api/v1/userphoto", userPhotoRoute);

// app.use("/api/v1/department", departmentRoute);
app.use("/api/v1/notification", notificationRoute);
app.use("/api/v1/monitoringTools", monitoringToolsRoute);
// app.use("/api/v1/category", categoryRoute);
// app.use("/api/v1/dashboard/filemanager", fileFolderRoute);
// app.use("/api/v1/dashboard/filemanager", uploadFileRoute);

// Listen to connections (optional for logging)

let onlineUsers = {};
global.onlineUsers = onlineUsers;

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  const user = socket.user; // from middleware above

  if (user?.role) {
    // ✅ Store online users for notification
    socket.on("registerUser", (userRole) => {
      onlineUsers[userRole] = socket.id;
      console.log(`🟢 User joined role room: ${userRole}`);
      socket.join(userRole);
    });
    socket.on("joinRoom", (alertId) => {
      socket.join(alertId);
      console.log(`Join Alert room: ${alertId}`);
    });
  }

  // ✅ Clear notifications

  socket.on("clearNotifications", (userRole) => {
    clearNotification(userRole, io);
  });

  // socket.on("getUnreadCounts", async (data, callback) => {
  //   const user = socket.user;

  //   if (!user?.role) {
  //     console.log("❌ User not authenticated in getUnreadCounts");
  //     return callback({});
  //   }

  //   try {
  //     const alerts = await Alert.find();

  //     const unreadCountMap = {};

  //     alerts.forEach((alert) => {
  //       unreadCountMap[alert._id] = alert.unreadBy;
  //     });

  //     // console.log("📤 Sending unreadMap to client:", unreadCountMap);

  //     callback(unreadCountMap);
  //   } catch (error) {
  //     console.error("❌ Error in getUnreadCounts:", error.message);
  //     callback({});
  //   }
  // });
  socket.on("sendMessage", (data) => {
    handleSocketChatMessage(data, io); // <-- Save + broadcast
  });

  // mark as read

  socket.on("markAsRead", (data) => {
    markAsReadChat(data, io);
  });

  //  Real-time notification handler
  // socket.on("send_notification", (data) => {
  //   handleSocketNotification(data, io); // <-- Save + broadcast
  // });

  socket.on("disconnect", () => {
    Object.keys(onlineUsers).forEach((id) => {
      if (onlineUsers[id] === socket.id) delete onlineUsers[id];
    });
    console.log("Socket disconnected", socket.id);
  });
});

export { io };

//error handler
app.use(errorHandler);

// Listen

server.listen(PORT, () => {
  mongodbConnection();
  console.log(`Server is running on port ${PORT}`.bgGreen.black);
});
