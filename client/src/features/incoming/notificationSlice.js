// create slice

import { createSlice } from "@reduxjs/toolkit";
import {
  getAllNotification,
  clearNotifications,
} from "./notificationApiSlice.js";

const initialState = {
  unreadCount: 0,
  notifications: [],
  notificationLoading: false,
  notificationError: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNotifications(state, action) {
      state.notifications = action.payload || [];
      state.unreadCount = state.notifications.filter((n) => !n.read).length;
    },
    addNotification(state, action) {
      const notif = action.payload;

      const currentUser = JSON.parse(localStorage.getItem("loginUser")); // or from Redux
      if (!currentUser) return;

      // Add only if current user role is in notif.toRoles
      if (notif.toRoles.includes(currentUser.role)) {
        state.notifications.unshift(notif);
        state.unreadCount += 1;

        // // Keep only latest 50
        // if (state.notifications.length > 50) state.notifications.pop();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllNotification.fulfilled, (state, action) => {
        state.notifications = action.payload.notification;
      })

      .addCase(clearNotifications.pending, (state, action) => {
        state.notificationLoading = true;
      })
      .addCase(clearNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notification
        state.unreadCount = 0;
        state.notificationLoading = false;
      })
      .addCase(clearNotifications.rejected, (state, action) => {

        state.error = action.payload?.error || "Failed to clear notifications";
        state.notificationLoading = false;
      });
  },
});

//selector export

export const notificationSelector = (state) => state.notification;

//actions export

export const { setNotifications, addNotification } = notificationSlice.actions;

//reducer export

export default notificationSlice.reducer;
