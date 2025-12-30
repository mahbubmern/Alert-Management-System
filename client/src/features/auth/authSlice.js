// create slice

import { createSlice } from "@reduxjs/toolkit";
import {
  accountActivation,
  createUserRegister,
  forgotPassword,
  getLoggedInUser,
  newActivationOTP,
  retrievePasswordByOTP,
  userLogin,
  userLogout,
} from "./authApiSlice";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: localStorage.getItem("loginUser")
      ? JSON.parse(localStorage.getItem("loginUser"))
      : null,
    message: null,
    error: null,
    loader: false,
  },
  reducers: {
    setEmptyMessage: (state) => {
      (state.message = null), (state.error = null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUserRegister.pending, (state) => {
        state.loader = true;
      })
      .addCase(createUserRegister.fulfilled, (state, action) => {
        state.loader = false;
        state.message = action.payload.message;
      })
      .addCase(createUserRegister.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      })
      // account Activation

      .addCase(accountActivation.pending, (state) => {
        state.loader = true;
      })
      .addCase(accountActivation.fulfilled, (state, action) => {
        state.loader = false;
        state.message = action.payload.message;
      })
      .addCase(accountActivation.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      })

      // new activation OTP

      .addCase(newActivationOTP.pending, (state) => {
        state.loader = true;
      })
      .addCase(newActivationOTP.fulfilled, (state, action) => {
        state.loader = false;
        state.message = action.payload.message;
      })
      .addCase(newActivationOTP.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      })

      // User login

      .addCase(userLogin.pending, (state) => {
        state.loader = true;
      })
      .addCase(userLogin.fulfilled, (state, action) => {
        state.loader = false;
        state.message = action.payload.message;
        state.user = action.payload.user;
        localStorage.setItem("loginUser", JSON.stringify(action.payload.user));
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      })

      // User logout

      .addCase(userLogout.pending, (state) => {
        state.loader = true;
      })
      .addCase(userLogout.fulfilled, (state, action) => {
        state.loader = false;
        state.message = action.payload.message;
        localStorage.removeItem("loginUser");

        state.user = null;
      })
      .addCase(userLogout.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      })
      // get logged in User Data

      .addCase(getLoggedInUser.pending, (state) => {
        state.loader = true;
      })
      .addCase(getLoggedInUser.fulfilled, (state, action) => {
        state.loader = false;
        state.user = action.payload.profile;
        localStorage.setItem(
          "loginUser",
          JSON.stringify(action.payload.profile)
        );
      })
      .addCase(getLoggedInUser.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
        state.user = null;
        localStorage.removeItem("loginUser");
      })
      // forgot Password

      .addCase(forgotPassword.pending, (state) => {
        state.loader = true;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loader = false;
        state.message = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      })
      // retrieve  Password By OTP

      .addCase(retrievePasswordByOTP.pending, (state) => {
        state.loader = true;
      })
      .addCase(retrievePasswordByOTP.fulfilled, (state, action) => {
        state.loader = false;
        state.message = action.payload.message;
      })
      .addCase(retrievePasswordByOTP.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      });
  },
});

//selector export

export const authSelector = (state) => state.auth;

//actions export

export const { setEmptyMessage } = authSlice.actions;

//reducer export

export default authSlice.reducer;
