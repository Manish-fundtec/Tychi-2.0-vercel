import mongoose from "mongoose";

const userPreferencesSchema = new mongoose.Schema({
  userId: { type: String, required: true },  // Link to User
  table: { type: String, required: true },  // Table name
  colDefs: { type: Array, required: true }, // User's column preferences
}, { timestamps: true });

const UserPreferences = mongoose.models.UserPreferences || mongoose.model("UserPreferences", userPreferencesSchema);

export default UserPreferences;
