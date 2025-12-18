import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkAndNotifyLongTermCases } from "@/lib/longterm-checker";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        // Only admins or IT leads can trigger the check
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "IT_LEAD")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const count = await checkAndNotifyLongTermCases();

        return NextResponse.json({
            success: true,
            notificationsSent: count
        });
    } catch (error) {
        console.error("Error in check-longterm API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
