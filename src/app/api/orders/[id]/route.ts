import { authOptions } from "@/features/auth/services/auth";
import { verifyAuthTokenAndGetUser } from "@/features/auth/services/authUtils";
import { prisma } from "@/lib/prisma";
import { OrderStatus, type Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

interface AuthResult {
	user: {
		id: number;
		email: string;
		name: string;
		role: Role;
	};
	status: number;
}

interface ErrorResult {
	error: string;
	status: number;
}

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;
		const orderId = Number.parseInt(paramId);
		if (Number.isNaN(orderId)) {
			return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
		}

		const secret = process.env.NEXTAUTH_SECRET;
		const token = await getToken({ req: _request, secret });

		let authResult: AuthResult | ErrorResult;

		if (token) {
			authResult = {
				user: {
					id: Number(token.id),
					email: token.email as string,
					name: token.name as string,
					role: token.role as Role,
				},
				status: 200,
			};
		} else {
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth_token")?.value;
			authResult = await verifyAuthTokenAndGetUser(authToken);
		}

		if ("error" in authResult) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status },
			);
		}

		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						role: true,
					},
				},
				items: {
					include: {
						baseWeapon: {
							select: {
								id: true,
								nom: true,
								prix_defaut: true,
								cout_production_defaut: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		const isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
			authResult.user.role,
		);

		if (!isAdmin && order.userId !== authResult.user.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to this order" },
				{ status: 403 },
			);
		}

		return NextResponse.json(order);
	} catch (error) {
		console.error("Error fetching order:", error);
		return NextResponse.json(
			{ error: "An error occurred while fetching the order" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const { id } = await context.params;
	try {
		const orderId = Number.parseInt(id);
		if (Number.isNaN(orderId)) {
			return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
		}

		const headers = request.headers;
		const _cookieHeader = headers.get("cookie");
		const secret = process.env.NEXTAUTH_SECRET;
		const token = await getToken({ req: request, secret });

		let authResult: AuthResult | ErrorResult;

		if (token) {
			authResult = {
				user: {
					id: Number(token.id),
					email: token.email as string,
					name: token.name as string,
					role: token.role as Role,
				},
				status: 200,
			};
		} else {
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth_token")?.value;
			authResult = await verifyAuthTokenAndGetUser(authToken);
		}

		if ("error" in authResult) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status },
			);
		}

		const isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
			authResult.user.role,
		);

		if (!isAdmin) {
			return NextResponse.json(
				{ error: "Only admins can update order status" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const { status } = body;

		if (!status || !Object.values(OrderStatus).includes(status)) {
			return NextResponse.json(
				{ error: "Invalid status value" },
				{ status: 400 },
			);
		}

		const existingOrder = await prisma.order.findUnique({
			where: { id: orderId },
		});

		if (!existingOrder) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		const updatedOrder = await prisma.order.update({
			where: { id: orderId },
			data: { status },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						role: true,
					},
				},
				items: {
					include: {
						baseWeapon: {
							select: {
								id: true,
								nom: true,
								prix_defaut: true,
								cout_production_defaut: true,
							},
						},
					},
				},
			},
		});

		return NextResponse.json(updatedOrder);
	} catch (error) {
		console.error("Error updating order:", error);
		return NextResponse.json(
			{ error: "An error occurred while updating the order" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const { id } = await context.params;
	try {
		const orderId = Number.parseInt(id);
		if (Number.isNaN(orderId)) {
			return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
		}

		const secret = process.env.NEXTAUTH_SECRET;
		const token = await getToken({ req: request, secret });

		let authResult: AuthResult | ErrorResult;

		if (token) {
			authResult = {
				user: {
					id: Number(token.id),
					email: token.email as string,
					name: token.name as string,
					role: token.role as Role,
				},
				status: 200,
			};
		} else {
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth_token")?.value;
			authResult = await verifyAuthTokenAndGetUser(authToken);
		}

		if ("error" in authResult) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status },
			);
		}

		const isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
			authResult.user.role,
		);

		if (!isAdmin) {
			return NextResponse.json(
				{ error: "Only admins can delete orders" },
				{ status: 403 },
			);
		}

		const existingOrder = await prisma.order.findUnique({
			where: { id: orderId },
		});

		if (!existingOrder) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		await prisma.order.delete({
			where: { id: orderId },
		});

		return NextResponse.json(
			{ message: "Order successfully deleted" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error deleting order:", error);
		return NextResponse.json(
			{ error: "An error occurred while deleting the order" },
			{ status: 500 },
		);
	}
}
