const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Change required to false for Google users
  googleId: { type: String }, // Add this field
  role: { type: String, default: "user" },
}, { timestamps: true });

// --- THE FIX IS HERE ---
// 1. Remove 'next' from the arguments
userSchema.pre("save", async function () {
  // 2. Only hash if the password is new or changed
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // 3. DO NOT CALL next() here when using an async function
});

// Method to compare passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);