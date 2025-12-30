import { createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "universal-cookie";
import API from "../../utils/api";

// create api thunk

// create user Register

export const createUserRegister = createAsyncThunk(
  "auth/createUserRegister",
  async (data) => {

    try {
      const response = await API.post(`/api/v1/auth/register`, data);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

// activation user

export const accountActivation = createAsyncThunk(
  "auth/accountActivation",
  async (data) => {
    try {
      // Retrieve the activation token inside the thunk
      const activationToken = new Cookies().get("activationToken");

      const response = await API.post(
        `/api/v1/auth/account-activate-by-otp/${activationToken}`,
        data
      );

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

// new Activation OTP

export const newActivationOTP = createAsyncThunk(
  "auth/newActivationOTP",
  async (data) => {
    try {
      // Retrieve the activation token inside the thunk
      // const activationToken = new Cookies().get("activationToken");

      const response = await API.post(`/api/v1/auth/new-activation-otp`, data);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

// User Login

export const userLogin = createAsyncThunk("auth/userLogin", async (data) => {
  try {
    // Retrieve the activation token inside the thunk
    // const activationToken = new Cookies().get("activationToken");

    const response = await API.post(`/api/v1/auth/login`, data);

    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
});

// User Logout

export const userLogout = createAsyncThunk("auth/userLogout", async () => {
  try {
    const response = await API.post(`/api/v1/auth/logout`, {});

    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
});

// Get User Logged in Data

export const getLoggedInUser = createAsyncThunk(
  "auth/getLoggedInUser",
  async () => {
    try {
      const response = await API.get(`/api/v1/auth/me`, {
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

// forgot Password

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (data) => {
    try {
      // Retrieve the activation token inside the thunk

      const response = await API.post(`/api/v1/auth/forgot-password`, data);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

// retrieve password by OTP
export const retrievePasswordByOTP = createAsyncThunk(
  "auth/retrievePasswordByOTP",
  async (data) => {
    try {
      // Retrieve the activation token inside the thunk
      const activationToken = new Cookies().get("activationToken");

      const response = await API.post(
        `/api/v1/auth/forgot-password-by-otp/${activationToken}`,
        data
      );

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

// get all user

// export const getAllUser = createAsyncThunk(
//   "auth/getAllUser",
//   async () => {
//     try {
//       const response = await axios.get(
//         `http://localhost:5050/api/v1/user`,
//         { withCredentials: true }
//       );

//       return response.data;
//     } catch (error) {
//       throw new Error(error.response.data.message);
//     }
//   }
// );
