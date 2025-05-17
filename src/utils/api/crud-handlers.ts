import { type NextRequest, NextResponse } from "next/server";

export function validateId(
	id: string | undefined,
): [boolean, number | null, NextResponse | null] {
	if (!id || id === "null") {
		return [
			false,
			null,
			NextResponse.json({ error: "Missing ID parameter" }, { status: 400 }),
		];
	}

	const parsedId = Number.parseInt(id);
	if (Number.isNaN(parsedId)) {
		return [
			false,
			null,
			NextResponse.json({ error: "Invalid ID format", id }, { status: 400 }),
		];
	}

	return [true, parsedId, null];
}

export function withErrorHandling<T>(
	handler: () => Promise<T>,
): Promise<T | NextResponse> {
	return handler().catch((error) => {
		console.error("API error:", error);
		const message = error instanceof Error ? error.message : String(error);
		const details =
			error instanceof Error ? { name: error.name, stack: error.stack } : {};

		return NextResponse.json(
			{
				error: "An error occurred",
				message,
				...details,
			},
			{ status: 500 },
		);
	});
}

export async function handleGetById<T>(
	params: { id: string },
	fetchFn: (id: number) => Promise<T | null>,
	entityName: string,
): Promise<NextResponse> {
	return withErrorHandling(async () => {
		const [isValid, id, errorResponse] = validateId(params.id);
		if (!isValid || id === null) return errorResponse as NextResponse;

		const entity = await fetchFn(id as number);
		if (!entity) {
			return NextResponse.json(
				{
					error: `${entityName} not found`,
					id,
				},
				{ status: 404 },
			);
		}

		return NextResponse.json(entity);
	}) as Promise<NextResponse>;
}

export function createCorsOptionsResponse(): NextResponse {
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Max-Age": "86400",
		},
	});
}

export async function parseRequestBody<T>(
	request: NextRequest,
): Promise<[T | null, NextResponse | null]> {
	try {
		const data = (await request.json()) as T;
		return [data, null];
	} catch (error) {
		return [
			null,
			NextResponse.json(
				{
					error: "Invalid request body",
					details: error instanceof Error ? error.message : String(error),
				},
				{ status: 400 },
			),
		];
	}
}
