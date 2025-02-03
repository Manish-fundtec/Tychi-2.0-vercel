import {NextRequest, NextResponse} from "next/server";
import { getManualJournal, createManualJournal , updateManualJournal , deleteManualJournal} from "./manualjournalDB";


export async function GET (request: Request){

    const greeting = "Hello World!!"
    const json = await getManualJournal();
    
    return NextResponse.json({json: json, greeting: greeting});
}
export async function POST(request: Request) {
    try {
      // Parse the incoming request data
      const manualjournalData = await request.json();
      const createdmanualjournal = await createManualJournal(manualjournalData);
  
      // Format the successful response
      const response = {
        status: "success",
        message: "Manualjournal successfully created",
        data: createdmanualjournal,
      };
  
      // Send back a JSON response
      return NextResponse.json(response);
    } catch (error) {
      console.error("Error in Manualjournal POST route:", error);
      return NextResponse.json(
        { status: "error", message: "Error creating Manualjournal" },
        { status: 500 } // Internal Server Error
      );
    }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "ID is required for deletion" },
        { status: 400 } 
      );
    }

    const deletedManualJournal = await deleteManualJournal(id);

    return NextResponse.json({
      status: "success",
      message: "ManualJournal successfully deleted",
      data: deletedManualJournal,
    });
  } catch (error) {
    console.error("Error in DELETE route:", error);
    return NextResponse.json(
      { status: "error", message: "Error deleting ManualJournal" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "ID is required for update" },
        { status: 400 } 
      );
    }

    const updatedData = await request.json();
    const updatedManualJournal = await updateManualJournal(id, updatedData);

    return NextResponse.json({
      status: "success",
      message: "ManualJournal successfully updated",
      data: updatedManualJournal,
    });
  } catch (error) {
    console.error("Error in PUT route:", error);
    return NextResponse.json(
      { status: "error", message: "Error updating ManualJournal" },
      { status: 500 }
    );
  }
}  