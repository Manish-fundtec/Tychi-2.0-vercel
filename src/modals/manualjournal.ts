import mongoose from "mongoose";

const ManualJournalSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    debitAccount: {
        type: String,
        required: true
    },
    creditAccount: {
        type: String, 
        required: true
    },
    amount: {
        type: String,
        required: true,
        min: [0, 'Amount must be a positive value']
    },
    description: {
        type: String,
        trim: true,
        default: 'No description provided'
    }
}, {
    timestamps: true 
});

// Export the schema as a model
const manualjournal = mongoose.models.manualjournal || mongoose.model("manualjournal", ManualJournalSchema);
export default manualjournal;