import {NextRequest, NextResponse} from "next/server";
import { getBroker, createBroker, updateBroker, deleteBroker  } from "../broker/brokerDB";

export async function GET (request: Request){

    const greeting = "Hello World!!"
    const json = await getBroker();
    
    return NextResponse.json({json: json, greeting: greeting});
}
export async function POST(request: Request) {
    try {
      // Parse the incoming request data
      const brokerData = await request.json();
  
      
      const createdBroker = await createBroker(brokerData);
  
      // Format the successful response
      const response = {
        status: "success",
        message: "Broker successfully created",
        data: createdBroker,
      };
  
      // Send back a JSON response
      return NextResponse.json(response);
    } catch (error) {
      console.error("Error in RFQ POST route:", error);
      return NextResponse.json(
        { status: "error", message: "Error creating Broker" },
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
    
        const updatedRFQ = await updateBroker(id, updateData);
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
  
      const deletedData = await deleteBroker(id);
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