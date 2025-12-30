// import React, { useState } from "react";
// import "./ChatBox.css";

// const ChatBox = ({ isOpen, onClose, onSend, messages }) => {
//   const [message, setMessage] = useState("");

//   const handleSend = () => {
//     if (message.trim()) {
//       onSend(message);
//       setMessage("");
//     }
//   };

//   return (
//     <div className={`chatbox ${isOpen ? "open" : "closed"}`}>
//       <div className="chatbox-header">
//         <span>Chat</span>
//         <button className="chatbox-close-btn" onClick={onClose} title="Close">
//           ×
//         </button>

//          </div>
//       <div className="chatbox-body">
//         {messages.map((msg, idx) => (
//           <div key={idx} className="chat-message">{msg}</div>
//         ))}
//       </div>
//       <div className="chatbox-footer">
//         <input
//           type="text"
//           placeholder="Type a message..."
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//         />
//         <button onClick={handleSend}>Send</button>
//       </div>
//     </div>
//   );
// };

// export default ChatBox;

import React, { useState, useEffect, useRef } from "react";
import socket from "../../helpers/socket.js";
import "./ChatBox.css";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessage,
  markUserAsRead,
  setUnreadBy,
  messageSelector,
  setMessages,
} from "../../features/incoming/messageSlice.js";
import API from "../../utils/api.js";

const ChatBox = ({ isOpen, onClose, alertId, user }) => {
  const [message, setMessage] = useState("");
  // const { alert } = useSelector(alertSelector);

  const dispatch = useDispatch();
  const { messagesByAlertId, unreadCountMap } = useSelector(messageSelector);
  const messages = messagesByAlertId[alertId] || [];

  const messageEndRef = useRef(null);

  //get all chating
  useEffect(() => {
    if (alertId) {
      const fetchMessages = async () => {
        try {
          const res = await API.get(`/api/v1/alert/chat/${alertId}`);
          const data = Array.isArray(res.data) ? res.data : [res.data];
          dispatch(setMessages({ alertId, messages: data }));
        } catch (error) {
          console.error("Error fetching chat messages:", error);
        }
      };

      fetchMessages();
    }
  }, [alertId, dispatch]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  // Handle new message send
  const handleSend = () => {
    if (message.trim()) {
      const messageData = {
        name: user.name,
        index: user.index,
        role: user.role,
        message,
        msgTime: new Date(),
      };
      socket.emit("sendMessage", { alertId, messageData });
      setMessage("");
    }
  };

  //   // trying code to chat end

  return (
<div
  className={`fixed bottom-20 right-4 w-72 sm:w-80 md:w-96 max-h-[400px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg flex flex-col z-50 transition-all duration-300 ${
    isOpen ? "flex" : "hidden"
  }`}
>
  {/* Header */}
  <div className="bg-cyan-600 text-white px-3 py-2 flex justify-between items-center rounded-t-xl">
    <span className="font-medium text-sm">Chat</span>
    <button
      onClick={onClose}
      className="text-lg font-bold hover:text-red-400 transition-colors"
      title="Close"
    >
      ×
    </button>
  </div>

  {/* Body */}
  <div className="flex-1 overflow-y-auto px-3 py-2 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
    {messages.map((msg, idx) => {
      const isCurrentUser = msg.index === user.index;
      const messageClass = isCurrentUser
        ? "bg-cyan-100 dark:bg-cyan-900 self-end text-right"
        : "bg-gray-200 dark:bg-gray-700 self-start text-left";

      const roleColor =
        msg.role === "admin"
          ? "bg-red-100 dark:bg-red-900"
          : msg.role === "Level_1"
          ? "bg-blue-100 dark:bg-blue-900"
          : msg.role === "Level_2"
          ? "bg-green-100 dark:bg-green-900"
          : "";

      return (
        <div
          key={idx}
          className={`max-w-[80%] p-2 mb-2 rounded-lg text-xs leading-snug shadow-sm ${messageClass} ${roleColor}`}
        >
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {msg.name}:
          </p>
          <p className="text-gray-700 dark:text-gray-200 break-words">
            {msg.message}
          </p>
          <small className="block mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
            {new Date(msg.msgTime).toLocaleTimeString()}
          </small>
        </div>
      );
    })}
    <div ref={messageEndRef} />
  </div>

  {/* Footer */}
  <div className="flex items-center border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 rounded-b-xl">
    <input
      type="text"
      placeholder="Type a message..."
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleSend()}
      className="flex-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    />
    <button
      onClick={handleSend}
      className="ml-2 px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
    >
      Send
    </button>
  </div>
</div>

  );
};

export default ChatBox;
