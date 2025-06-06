// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   // Initialize Supabase client that reads cookies to get current session
//   const supabase = createRouteHandlerClient({ cookies });

//   // Parse request body
//   const { password, confirmPhrase } = await request.json();

//   // Require correct confirm phrase
//   if (confirmPhrase !== "Delete all my data") {
//     return NextResponse.json(
//       { error: "Incorrect confirmation phrase." },
//       { status: 400 }
//     );
//   }

//   // Retrieve current session and user
//   const {
//     data: { session },
//     error: sessionError,
//   } = await supabase.auth.getSession();

//   if (sessionError || !session?.user) {
//     return NextResponse.json(
//       { error: "Not authenticated. Please log in again." },
//       { status: 401 }
//     );
//   }

//   const userId = session.user.id;
//   const email = session.user.email;

//   if (!email) {
//     return NextResponse.json(
//       { error: "Email not found. Cannot reauthenticate." },
//       { status: 400 }
//     );
//   }

//   // Re-authenticate with provided password
//   const { data: reauthData, error: reauthError } =
//     await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//   if (reauthError || !reauthData.session) {
//     return NextResponse.json(
//       { error: "Reauthentication failed. Wrong password." },
//       { status: 401 }
//     );
//   }

//   // Delete associated data first (e.g., "plans" table)
//   await supabase.from("plans").delete().eq("user_id", userId);
//   // ... delete other tables linked by user_id as needed ...

//   // Use a separate Admin client to delete the Auth user
//   const adminClient = createRouteHandlerClient(
//     {},
//     {
//       supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
//       supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
//     }
//   );

//   const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
//   if (deleteError) {
//     return NextResponse.json(
//       { error: "Failed to delete user." },
//       { status: 500 }
//     );
//   }

//   return NextResponse.json({ message: "Account and data deleted successfully." });
// }