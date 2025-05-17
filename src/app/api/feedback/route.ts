import { authOptions } from "@/features/auth/services/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/services/api";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { type, title, description, status, userId } = await request.json();
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized - User must be logged in to submit feedback" },
				{ status: 401 },
			);
		}

		const finalUserId =
			userId ?? (session.user.id ? Number(session.user.id) : undefined);

		const finalStatus = session?.user.role === Role.DEVELOPER ? status : "OPEN";

		const feedback = await prisma.feedback.create({
			data: {
				type,
				title,
				description,
				status: finalStatus,
				...(finalUserId ? { user_id: finalUserId } : {}),
			},
			...(finalUserId
				? {
						include: {
							user: true,
						},
					}
				: {}),
		});

		return NextResponse.json(feedback);
	} catch (error) {
		console.error("Error creating feedback:", error);
		return NextResponse.json(
			{ error: "Failed to create feedback" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user.role !== Role.DEVELOPER) {
			return NextResponse.json(
				{ error: "Unauthorized - Only developers can view all feedback" },
				{ status: 401 },
			);
		}

		const feedback = await prisma.feedback.findMany({
			include: {
				user: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(feedback);
	} catch (error) {
		console.error("Error fetching feedback:", error);
		return NextResponse.json(
			{ error: "Failed to fetch feedback" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user.role !== Role.DEVELOPER) {
			return NextResponse.json(
				{ error: "Unauthorized - Only developers can update feedback" },
				{ status: 401 },
			);
		}

		const { id, status } = await request.json();

		const feedback = await prisma.feedback.update({
			where: { id },
			data: { status },
			include: {
				user: true,
			},
		});

		return NextResponse.json(feedback);
	} catch (error) {
		console.error("Error updating feedback:", error);
		return NextResponse.json(
			{ error: "Failed to update feedback" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user.role !== Role.DEVELOPER) {
			return NextResponse.json(
				{ error: "Unauthorized - Only developers can delete feedback" },
				{ status: 401 },
			);
		}

		const { searchParams } = new URL(request.url);
		const id = Number.parseInt(searchParams.get("id") || "");

		if (!id || Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid feedback ID" },
				{ status: 400 },
			);
		}

		await prisma.feedback.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting feedback:", error);
		return NextResponse.json(
			{ error: "Failed to delete feedback" },
			{ status: 500 },
		);
	}
}
