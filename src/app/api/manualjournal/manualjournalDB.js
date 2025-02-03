import db from "../../../../lib/mongodb";
import manualjournal from "@/modals/manualjournal";

export async function getManualJournal() {
    try {
      await db.connect();
      const manualjournal = await manualjournal.find(); // Retrieve all RFQs
      console.log("manualjournal",manualjournal);
      return manualjournal; // Return the list of RFQs
    } catch (error) {
      console.error("Error retrieving all manualjournals:", error);
      throw error; // Re-throw the error to be caught in the main GET function
    } finally {
      // Ensure the database connection is closed
      await db.disconnect();
    }
  }

export async function createManualJournal(manualjournalData) {
    try {
      // Connect to the database
      await db.connect();
     
      const newmanualjournal = await manualjournal.create(manualjournalData);
  
      console.log("RFQ successfully created:", newmanualjournal);
      return newmanualjournal;
    } catch (error) {
      console.error("Error creating RFQ:", error);
      throw error;
    } finally {
      // Disconnect from the database
      await db.disconnect();
    }
  }

export async function deleteManualJournal(id) {
  try {
    // Connect to the database
    await db.connect();

    const deletedManualJournal = await manualjournal.findByIdAndDelete(id);

    if (!deletedManualJournal) {
      throw new Error(`ManualJournal with id ${id} not found.`);
    }

    console.log("ManualJournal successfully deleted:", deletedManualJournal);
    return deletedManualJournal;
  } catch (error) {
    console.error("Error deleting ManualJournal:", error);
    throw error;
  } finally {
    // Disconnect from the database
    await db.disconnect();
  }
}

export async function updateManualJournal(id, updatedData) {
  try {
    // Connect to the database
    await db.connect();

    const updatedManualJournal = await manualjournal.findByIdAndUpdate(
      id,
      updatedData,
      { new: true } // Return the updated document
    );

    if (!updatedManualJournal) {
      throw new Error(`ManualJournal with id ${id} not found.`);
    }

    console.log("ManualJournal successfully updated:", updatedManualJournal);
    return updatedManualJournal;
  } catch (error) {
    console.error("Error updating ManualJournal:", error);
    throw error;
  } finally {
    // Disconnect from the database
    await db.disconnect();
  }
}
 