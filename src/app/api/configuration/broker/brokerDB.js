import db from "@/lib/mongodb";
import Broker from "@/modals/configuration/broker";

  export async function getBroker() {
    try {
      await db.connect();
      const rfqs = await Broker.find(); // Retrieve all RFQs
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
  export async function createBroker(brokerData) {
    try {
      // Connect to the database
      await db.connect();
     
      const newBroker = await Broker.create(brokerData);
  
      console.log("RFQ successfully created:", newBroker);
      return newBroker;
    } catch (error) {
      console.error("Error creating Broker:", error);
      throw error;
    } finally {
      // Disconnect from the database
      await db.disconnect();
    }
  }

  export async function updateBroker(id, updateData) {
    try {
      await db.connect();
      const updatedRFQ = await Broker.findByIdAndUpdate(id, updateData, { new: true });
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

  export async function deleteBroker(id) {
    try {
      await db.connect();
      const deletedData = await Broker.findByIdAndDelete(id);
      if (!deletedData) {
        throw new Error(`RFQ with id ${id} not found`);
      }
      console.log("RFQ successfully deleted:", deletedData);
      return deletedData;
    } catch (error) {
      console.error("Error deleting RFQ:", error);
      throw error;
    } finally {
      await db.disconnect();
    }
  }