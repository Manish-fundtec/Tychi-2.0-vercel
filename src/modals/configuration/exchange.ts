import mongoose from "mongoose";


const exchangeSchema = new mongoose.Schema(
    {    
      UID: { type: String, required: true },
      exchangeid: { type: String, required: true},
      exchangename: { type: String, required: true }
    },
    {
      timestamps: true,
    }
  );
  
  // Define a pre middleware for find operations to filter out deleted records
  
  const Exchange = mongoose.models.Exchange || mongoose.model("Exchange", exchangeSchema);
  export default Exchange; 