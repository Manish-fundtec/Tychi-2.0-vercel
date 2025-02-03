import mongoose from "mongoose";


const tradeSchema = new mongoose.Schema(
    {    
      name: { type: String, required: true },
      email: { type: String, required: true},
      phone: { type: String, required: true },
    },
    {
      timestamps: true,
    }
  );
  
  // Define a pre middleware for find operations to filter out deleted records
  
  const Trades = mongoose.models.Trades || mongoose.model("Trades", tradeSchema);
  export default Trades; 