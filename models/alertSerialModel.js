import mongoose from "mongoose";

//create schema
const alertSerialSchema  = mongoose.Schema(
{
    date: { type: String, required: true, unique: true }, // '20250601'
    serial: { type: Number, default: 0 },
}
   
);

//export user schema

export default mongoose.model("AlertSerial", alertSerialSchema );
