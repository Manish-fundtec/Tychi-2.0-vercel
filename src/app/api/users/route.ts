import db from "@/lib/mongodb";
import User from "@/modals/User";
import {NextRequest, NextResponse} from "next/server";


// export async function GET (request: Request){

//     const greeting = "Hello World!!"
    
//     return NextResponse.json({greeting: greeting});
// }
export async function POST(request: Request) {
  try {
    await db.connect();

    const { userId, userName, email } = await request.json();

    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return new Response(JSON.stringify({ status: "error", message: "User already exists." }), { status: 400 });
    }

    const newUser = await User.create({ userId, userName, email });

    return new Response(JSON.stringify({ status: "success", data: newUser }), { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ status: "error", message: "Failed to create user." }), { status: 500 });
  } finally {
    await db.disconnect();
  }
}
