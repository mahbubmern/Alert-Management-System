import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/api";

// create Incoming File

export const createAlert = createAsyncThunk(
  "incoming/createAlert",
  async (data) => {
    try {
      const response = await API.post(`/api/v1/alert/paginated`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Upload failed");
    }
  }
);

export const getAllAlert = createAsyncThunk(
  "incoming/getAllAlert",
  async () => {
    try {
      const response = await API.get(`/api/v1/alert/paginated`);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

export const editAlert = createAsyncThunk(
  "incoming/editAlert",
  async (data) => {
    try {
      const response = await API.patch(`/api/v1/alert/${data._id}`, data);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

export const updateInvestigationAlert = createAsyncThunk(
  "incoming/updateInvestigationAlert",
  async (data) => {
    try {
      const response = await API.put(`/api/v1/alert/${data.get("_id")}`, data);

      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);

// update level 2  investigation alert

export const updateLevel2InvestigationAlert = createAsyncThunk(
  "incoming/updateLevel2InvestigationAlert",
  async ({id, data}) => {
   
    try {
      const response = await API.patch(
        `/api/v1/alert/level2Investigation/${id}`,
        data // now regular JSON
      );
      
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);


// update incidence declaration

export const updateIncidenceDeclaration = createAsyncThunk(
  "incoming/updateIncidenceDeclaration",
  async ({id, data}) => {


    try {
      const response = await API.patch(
        `/api/v1/alert/incidenceDeclaration/${id}`,
        data // now regular JSON
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
);
