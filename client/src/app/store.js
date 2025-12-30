// create store

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import userReducer from "../features/users/userSlice";
// import incomingReducer from "../features/incoming/incomingSlice";
import alertReducer from "../features/incoming/alertSlice";
import notificationReducer from "../features/incoming/notificationSlice";
import monitoringToolsAvailabilityReducer from "../features/incoming/monitoringToolsSlice";
import messageReducer from "../features/incoming/messageSlice";

import userCredReducer from "../features/userCred/userCredSlice";
import userPersonalReducer from "../features/userPersonal/userPersonalSlice";
import userPhotolReducer from "../features/userPhoto/userPhotoSlice";

import loaderReducer from "../features/incoming/loaderSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    // incoming: incomingReducer,
    alert: alertReducer,
    // task: taskReducer,
    messages: messageReducer,
    userCred: userCredReducer,
    userPersonal: userPersonalReducer,
    userPhoto: userPhotolReducer,
    monitoringTools: monitoringToolsAvailabilityReducer,
    notification: notificationReducer,
    loader: loaderReducer,
  },
  middleware: (getDefaultMiddlewares) => getDefaultMiddlewares(),
  devTools: true,
});

export default store;
