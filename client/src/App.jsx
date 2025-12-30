import { RouterProvider } from "react-router-dom";
import "./App.css";
import router from "./router/route";
import { ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getLoggedInUser } from "./features/auth/authApiSlice";
import { authSelector } from "./features/auth/authSlice";
import { alertSelector } from "./features/incoming/alertSlice";
import socket from "./helpers/socket";
import { setUnreadBy } from "./features/incoming/messageSlice";
import { getAllAlert } from "./features/incoming/alertApiSlice";
import {
  addNotification,
  setNotifications,
} from "./features/incoming/notificationSlice";
import API from "./utils/api";
import { clearNotifications } from "./features/incoming/notificationApiSlice";

import { useState } from "react";

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector(authSelector);
  const { alert } = useSelector(alertSelector);

  const unreadCount = useSelector((state) => state.notification.unreadCount);


  useEffect(() => {
    if (localStorage.getItem("loginUser")) {
      dispatch(getLoggedInUser());
    }
  }, [dispatch]);

  useEffect(() => {
    // Redirect from root route to login
    if (window.location.pathname === "/") {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    dispatch(getAllAlert());
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    // ✅ Connect socket only once user is logged in
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      // Register user for Notification
      socket.emit("registerUser", user.role);

      alert?.forEach((a) => {
        // console.log("📡 Joining room:", a._id);
        socket.emit("joinRoom", a._id);
      });
    };

    socket.on("connect", handleConnect);

    // Load initial notifications
    API.get(`/api/v1/alert/notification`).then((res) => {
      dispatch(setNotifications(res.data.notification));
    });
    // ⚡ Register newNotification listener only once
    const handleNewNotification = (notif) => {
      if (notif.toRoles.includes(user.role)) {
        dispatch(addNotification(notif));
      }
    };
    socket.on("newNotification", handleNewNotification);

    // Listen for clear event
    socket.on("notificationsCleared", () => {
      dispatch(clearNotifications());
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notificationsCleared");
      socket.off("newNotification", handleNewNotification);
    };
  }, [user, alert]);

  return (
    <>
      <ToastContainer
        style={{ zIndex: "999999999" }}
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <RouterProvider router={router} />
    </>
  );
}

export default App;
