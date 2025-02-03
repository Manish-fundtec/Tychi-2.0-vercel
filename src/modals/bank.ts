import mongoose from "mongoose";

const BankSchema = new mongoose.Schema(
    {   
      id: { type: String, required: true },
      name: { type: String, required: true },
      date:{type:String , required:true},
    },
    {
      timestamps: true,
    }
  );
  
  // Define a pre middleware for find operations to filter out deleted records
  
  const bank = mongoose.models.bank || mongoose.model("bank", BankSchema);
  export default bank;