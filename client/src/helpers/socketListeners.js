import socket from "./socket.js";
import { addMessage, setUnreadBy } from "../features/incoming/messageSlice.js";

export default function setupGlobalSocketListeners(store) {
  socket.on("receiveMessage", ({ alertId, message, unreadBy }) => {
    store.dispatch(addMessage({ alertId, message }));
    store.dispatch(setUnreadBy({ alertId, unreadBy }));
  });

  socket.on("updateUnread", ({ alertId, unreadBy }) => {
    store.dispatch(setUnreadBy({ alertId, unreadBy }));
  });
}