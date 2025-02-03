import db from "@/lib/mongodb";
import Trades from "@/modals/trades";

export async function getTrades() {
    try {
      await db.connect();
      const rfqs = await Trades.find(); // Retrieve all RFQs
      console.log("rfqs",rfqs);
      return rfqs; // Return the list of RFQs
    } catch (error) {
      console.error("Error retrieving all RFQs:", error);
      throw error; // Re-throw the error to be caught in the main GET function
    } finally {
      // Ensure the database connection is closed
      await db.disconnect();
    }
}
export async function createTrade(rfqData) {
    try {
      // Connect to the database
      await db.connect();
     
      const newRFQ = await Trades.create(rfqData);
  
      console.log("RFQ successfully created:", newRFQ);
      return newRFQ;
    } catch (error) {
      console.error("Error creating RFQ:", error);
      throw error;
    } finally {
      // Disconnect from the database
      await db.disconnect();
    }
}
  export async function deleteTrade(id) {
    try {
      await db.connect();
      const deletedRFQ = await Trades.findByIdAndDelete(id);
      if (!deletedRFQ) {
        throw new Error(`RFQ with id ${id} not found`);
      }
      console.log("RFQ successfully deleted:", deletedRFQ);
      return deletedRFQ;
    } catch (error) {
      console.error("Error deleting RFQ:", error);
      throw error;
    } finally {
      await db.disconnect();
    }
}
  export async function updateTrade(id, updateData) {
    try {
      await db.connect();
      const updatedRFQ = await Trades.findByIdAndUpdate(id, updateData, { new: true });
      if (!updatedRFQ) {
        throw new Error(`RFQ with id ${id} not found`);
      }
      console.log("RFQ successfully updated:", updatedRFQ);
      return updatedRFQ;
    } catch (error) {
      console.error("Error updating RFQ:", error);
      throw error;
    } finally {
      await db.disconnect();
    }
}
