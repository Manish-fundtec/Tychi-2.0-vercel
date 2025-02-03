import {NextRequest, NextResponse} from "next/server";
import { getBank, createBank ,deleteBank ,updateBank } from "./bankDB";


export async function GET (request: NextRequest){

    const greeting = "Hello World!!"
    const json = await getBank();
    
    return NextResponse.json({json: json, greeting: greeting});
}
export async function POST(request: Request) {
    try {
      // Parse the incoming request data
      const bankData = await request.json();
  
      
      const createdBank = await createBank(bankData);
  
      // Format the successful response
      const response = {
        status: "success",
        message: "Bank successfully created",
        data: createdBank,
      };
  
      // Send back a JSON response
      return NextResponse.json(response);
    } catch (error) {
      console.error("Error in Add Bank POST route:", error);
      return NextResponse.json(
        { status: "error", message: "Error creating Bank account" },
        { status: 500 }
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
  
      const updatedRFQ = await updateBank(id, updateData);
      return NextResponse.json({
        status: "success",
        message: "Bank successfully updated",
        data: updatedRFQ,
      });
    } catch (error) {
      console.error("Error in Bank PUT route:", error);
      return NextResponse.json({ status: "error", message: "Error updating Bank" }, { status: 500 });
    }
  }
  
  export async function DELETE(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
  
      if (!id) {
        return new Response(
          JSON.stringify({ status: "error", message: "ID is required for deletion" }),
          { status: 400 }
        );
      }
  
      const deletedBank = await deleteBank(id);
      return new Response(
        JSON.stringify({
          status: "success",
          message: "Bank successfully deleted",
          data: deletedBank,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error("Error in DELETE /api/bank:", error);
      return new Response(
        JSON.stringify({ status: "error", message: "Error deleting bank" }),
        { status: 500 }
      );
    }
  } 