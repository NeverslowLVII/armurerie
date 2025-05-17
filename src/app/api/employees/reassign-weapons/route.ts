import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const fromUserId = Number.parseInt(searchParams.get("from_user_id") || "");
		const toUserId = Number.parseInt(searchParams.get("to_user_id") || "");

		// Validate user IDs
		if (Number.isNaN(fromUserId) || Number.isNaN(toUserId)) {
			console.error("Invalid user IDs:", { fromUserId, toUserId });
			return NextResponse.json(
				{ error: "Invalid user IDs", fromUserId, toUserId },
				{ status: 400 },
			);
		}

		const [fromUser, toUser] = await Promise.all([
			prisma.user.findUnique({ where: { id: fromUserId } }),
			prisma.user.findUnique({ where: { id: toUserId } }),
		]);

		if (!fromUser || !toUser) {
			console.error("One or both users not found:", { fromUserId, toUserId });
			return NextResponse.json(
				{
					error: "One or both users not found",
					fromUser: fromUser ? "found" : "not found",
					toUser: toUser ? "found" : "not found",
				},
				{ status: 404 },
			);
		}

		const result = await prisma.weapon.updateMany({
			where: { user_id: fromUserId },
			data: { user_id: toUserId },
		});

		console.info("Weapons reassigned successfully:", result);
		return NextResponse.json({
			success: true,
			message: `${result.count} weapons reassigned from user ${fromUserId} to ${toUserId}`,
			count: result.count,
		});
	} catch (error) {
		console.error("Reassign weapons error:", error);
		return NextResponse.json(
			{ error: "Failed to reassign weapons" },
			{ status: 500 },
		);
	}
}

export const dynamic = "force-dynamic";

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Max-Age": "86400",
		},
	});
}
