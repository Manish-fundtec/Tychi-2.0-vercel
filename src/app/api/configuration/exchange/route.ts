import {NextRequest, NextResponse} from "next/server";
import { getExchange, createExchange, updateExchange, deleteExchange  } from "../exchange/exchangeDB";

export async function GET (request: NextRequest){

    const json = await getExchange();
    
    return NextResponse.json({json: json});
}
export async function POST(request: NextRequest) {
    try {
      // Parse the incoming request data
      const exchangeData = await request.json();
  
      
      const createdExchange = await createExchange(exchangeData);
  
      // Format the successful response
      const response = {
        status: "success",
        message: "exchange successfully created",
        data: createdExchange,
      };
  
      // Send back a JSON response
      return NextResponse.json(response);
    } catch (error) {
      console.error("Error in RFQ POST route:", error);
      return NextResponse.json(
        { status: "error", message: "Error creating exchange" },
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
    
        const updatedExchange = await updateExchange(id, updateData);
        return NextResponse.json({
          status: "success",
          message: "Exchange successfully updated",
          data: updatedExchange,
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
  
      const deletedData = await deleteExchange(id);
      return NextResponse.json({
        status: "success",
        message: "RFQ successfully deleted",
        data: deletedData,
      });
    } catch (error) {
      console.error("Error in RFQ DELETE route:", error);
      return NextResponse.json({ status: "error", message: "Error deleting RFQ" }, { status: 500 });
    }
  }