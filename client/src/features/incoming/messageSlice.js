import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    messagesByAlertId: {},
    unreadCountMap: {}, // { alertId: [userIndex1, userIndex2] }
  },
  reducers: {
    setMessages(state, action) {
      const { alertId, messages } = action.payload;
      state.messagesByAlertId[alertId] = Array.isArray(messages)
        ? messages
        : [];
    },
    addMessage(state, action) {
      const { alertId, message } = action.payload;

      if (!state.messagesByAlertId[alertId]) {
        state.messagesByAlertId[alertId] = [];
      }
      state.messagesByAlertId[alertId].push(message);
    },
    setUnreadBy(state, action) {
      const { alertId, unreadBy } = action.payload;
      state.unreadCountMap[alertId] = unreadBy;
    },
    markUserAsRead(state, action) {
      const { alertId, userRole } = action.payload;
      if (state.unreadCountMap[alertId]) {
        state.unreadCountMap[alertId] = state.unreadCountMap[alertId].filter(
          (u) => u !== userRole
        );
      }
    },
  },
});

export const { setMessages, addMessage, setUnreadBy, markUserAsRead } =
  messageSlice.actions;

export const messageSelector = (state) => state.messages;
export default messageSlice.reducer;
