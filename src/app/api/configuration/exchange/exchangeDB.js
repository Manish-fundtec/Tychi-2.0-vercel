import db from "@/lib/mongodb";
import Exchange from "@/modals/configuration/exchange";

  export async function getExchange() {
    try {
      await db.connect();
      const exchangeData = await Exchange.find(); // Retrieve all RFQs
      console.log("exchangeData",exchangeData);
      return exchangeData; // Return the list of RFQs
    } catch (error) {
      console.error("Error retrieving all RFQs:", error);
      throw error; // Re-throw the error to be caught in the main GET function
    } finally {
      // Ensure the database connection is closed
      await db.disconnect();
    }
  }
  export async function createExchange(exchangeData) {
    try {
      // Connect to the database
      await db.connect();
     
      const newExchange = await Exchange.create(exchangeData);
  
      console.log("RFQ successfully created:", newExchange);
      return newExchange;
    } catch (error) {
      console.error("Error creating Exchange:", error);
      throw error;
    } finally {
      // Disconnect from the database
      await db.disconnect();
    }
  }

  export async function updateExchange(id, updateData) {
    try {
      await db.connect();
      const updatedExchange = await Exchange.findByIdAndUpdate(id, updateData, { new: true });
      if (!updatedExchange) {
        throw new Error(`RFQ with id ${id} not found`);
      }
      console.log("RFQ successfully updated:", updatedExchange);
      return updatedExchange;
    } catch (error) {
      console.error("Error updating RFQ:", error);
      throw error;
    } finally {
      await db.disconnect();
    }
  }

  export async function deleteExchange(id) {
    try {
      await db.connect();
      const deletedData = await Exchange.findByIdAndDelete(id);
      if (!deletedData) {
        throw new Error(`RFQ with id ${id} not found`);
      }
      console.log("Exchange successfully deleted:", deletedData);
      return deletedData;
    } catch (error) {
      console.error("Error deleting RFQ:", error);
      throw error;
    } finally {
      await db.disconnect();
    }
  }