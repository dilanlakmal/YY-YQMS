import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  emp_id: { type: String },
  emp_code: { type: String },
  eng_name: { type: String },
  kh_name: { type: String },
  name: { type: String, required: true },
  email: { type: String },
  password: { type: String },
  roles: { type: [String], default: [] }, // Define roles as an array of strings
  sub_roles: { type: [String], default: [] }, // Define sub_roles as an array of strings
  job_title: { type: String },
  sup_code: { type: String },
  working_status: { type: String },
  dept_name: { type: String },
  sect_name: { type: String },
  profile: { type: String },
  device_token: { type: Map, of: String }, // Use Map for device_token
  remember_token: { type: String },
  face_id: { type: String },
  face_photo: { type: String }, // Added face_photo field
  phone_number: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default (connection) => connection.model("User", userSchema);
