import db from "../../../../lib/mongodb";
import bank from "@/modals/bank";

export async function getBank() {
    try {
      await db.connect();
      const banks = await bank.find(); // Retrieve all Banks
      console.log("banks",banks);
      return banks; // Return the list of banks
    } catch (error) {
      console.error("Error retrieving all banks:", error);
      throw error; // Re-throw the error to be caught in the main GET function
    } finally {
      // Ensure the database connection is closed
      await db.disconnect();
    }
  }

export async function createBank(banksData) {
    try {
      // Connect to the database
      await db.connect();
     
      const newBank = await bank.create(banksData);
  
      console.log("RFQ successfully created:", newBank);
      return newBank;
    } catch (error) {
      console.error("Error creating Bank:", error);
      throw error;
    } finally {
      // Disconnect from the database
      await db.disconnect();
    }
  }

  // Delete a bank by ID
export async function deleteBank(id) {
    try {
      // Connect to the database
      await db.connect();
  
      const deletedBank = await bank.findByIdAndDelete(id);
  
      if (!deletedBank) {
        throw new Error(`Bank with id ${id} not found.`);
      }
  
      console.log("Bank successfully deleted:", deletedBank);
      return deletedBank;
    } catch (error) {
      console.error("Error deleting bank:", error);
      throw error;
    } finally {
      // Disconnect from the database
      await db.disconnect();
    }
  }
  
  // Update a bank by ID
  export async function updateBank(id, updatedData) {
    try {
      // Connect to the database
      await db.connect();
  
      const updatedBank = await bank.findByIdAndUpdate(
        id, updatedData, { new: true }
      );
  
      if (!updatedBank) {
        throw new Error(`Bank with id ${id} not found.`);
      }
  
      console.log("Bank successfully updated:", updatedBank);
      return updatedBank;
    } catch (error) {
      console.error("Error updating bank:", error);
      throw error;
    } finally {
      // Disconnect from the database
      await db.disconnect();
    }
  }