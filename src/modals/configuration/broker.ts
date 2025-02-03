import mongoose from "mongoose";


const brokerSchema = new mongoose.Schema(
    {    
      UID: { type: String, required: true },
      name: { type: String, required: true},
      startdate: { type: String, required: true }
    },
    {
      timestamps: true,
    }
  );
  
  // Define a pre middleware for find operations to filter out deleted records
  
  const Broker = mongoose.models.Broker || mongoose.model("Broker", brokerSchema);
  export default Broker; 