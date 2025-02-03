import {NextRequest, NextResponse} from "next/server";
import { getTrades, createTrade , deleteTrade, updateTrade } from "./tradeDB";

export async function GET (request: Request){

    const greeting = "Hello World!!"
    const json = await getTrades();
    
    return NextResponse.json({json: json, greeting: greeting});
}
export async function POST(request: Request) {
    try {
      // Parse the incoming request data
      const rfqData = await request.json();
  
      
      const createdRFQ = await createTrade(rfqData);
  
      // Format the successful response
      const response = {
        status: "success",
        message: "RFQ successfully created",
        data: createdRFQ,
      };
  
      // Send back a JSON response
      return NextResponse.json(response);
    } catch (error) {
      console.error("Error in RFQ POST route:", error);
      return NextResponse.json(
        { status: "error", message: "Error creating RFQ" },
        { status: 500 } // Internal Server Error
      );
    }
  }

  export async function PUT(request: Request) {
    try {
      const { id, updateData } = await request.json();
      if (!id || !updateData) {
        return NextResponse.json(
          { status: "error", message: "Missing id or update data in request body" },
          { status: 400 }
        );
      }
  
      const updatedRFQ = await updateTrade(id, updateData);
      return NextResponse.json({
        status: "success",
        message: "RFQ successfully updated",
        data: updatedRFQ,
      });
    } catch (error) {
      console.error("Error in RFQ PUT route:", error);
      return NextResponse.json({ status: "error", message: "Error updating RFQ" }, { status: 500 });
    }
  }
  
  export async function DELETE(request: Request) {
    try {
      const { id } = await request.json();
      if (!id) {
        return NextResponse.json(
          { status: "error", message: "Missing id in request body" },
          { status: 400 }
        );
      }
  
      const deletedRFQ = await deleteTrade(id);
      return NextResponse.json({
        status: "success",
        message: "RFQ successfully deleted",
        data: deletedRFQ,
      });
    } catch (error) {
      console.error("Error in RFQ DELETE route:", error);
      return NextResponse.json({ status: "error", message: "Error deleting RFQ" }, { status: 500 });
    }
  }