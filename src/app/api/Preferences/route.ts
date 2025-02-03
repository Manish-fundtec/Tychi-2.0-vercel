import db from "@/lib/mongodb";
import UserPreferences from "@/modals/userPreferences";
import { tableColDefs } from "@/config/colDefs";

// export async function GET(request: Request) {
//   try {
//     await db.connect();
//     const { searchParams } = new URL(request.url);
//     const userId = searchParams.get("userId");
//     const table = searchParams.get("table");

//     const userPreferences = await UserPreferences.findOne({ userId, table });
//     // const colDefs = userPreferences ? userPreferences.colDefs : tableColDefs[table];
//     // Ensure `table` is not null before using it as an index
//     const safeTable = table ?? "defaultTable"; // ✅ Replace "defaultTable" with an actual valid key
//     const colDefs = userPreferences ? userPreferences.colDefs : tableColDefs[safeTable];


//     return new Response(JSON.stringify({ status: "success", colDefs }), { status: 200 });
//   } catch (error) {
//     console.error("Error fetching preferences:", error);
//     return new Response(JSON.stringify({ status: "error", message: "Failed to fetch preferences." }), { status: 500 });
//   } finally {
//     await db.disconnect();
//   }
// }
export async function GET(request: Request) {
  try {
    await db.connect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const table = searchParams.get("table");

    // Ensure `table` is not null and is a valid key
    if (!table || !(table in tableColDefs)) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid or missing table name." }),
        { status: 400 }
      );
    }

    const userPreferences = await UserPreferences.findOne({ userId, table });
    const colDefs = userPreferences ? userPreferences.colDefs : tableColDefs[table as keyof typeof tableColDefs];

    return new Response(JSON.stringify({ status: "success", colDefs }), { status: 200 });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return new Response(JSON.stringify({ status: "error", message: "Failed to fetch preferences." }), { status: 500 });
  } finally {
    await db.disconnect();
  }
}

export async function POST(request: Request) {
  try {
    await db.connect();
    const { userId, table, colDefs } = await request.json();

    // Ensure `table` is not null and is a valid key
    if (!table || !(table in tableColDefs)) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid or missing table name." }),
        { status: 400 }
      );
    }

    const existingPreference = await UserPreferences.findOne({ userId, table });
    if (existingPreference) {
      existingPreference.colDefs = colDefs;
      await existingPreference.save();
    } else {
      await UserPreferences.create({ userId, table, colDefs });
    }

    return new Response(JSON.stringify({ status: "success", message: "Preferences saved." }), { status: 200 });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return new Response(JSON.stringify({ status: "error", message: "Failed to save preferences." }), { status: 500 });
  } finally {
    await db.disconnect();
  }
}
