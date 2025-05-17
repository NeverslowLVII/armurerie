import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicRoutes = [
	"/auth/signin",
	"/auth/error",
	"/auth/reset",
	"/auth/setup",
	"/api/auth/callback/credentials",
	"/api/auth/csrf",
	"/api/auth/session",
	"/api/auth/providers",
	"/api/auth/signin",
	"/api/auth/signout",
	"/favicon.ico",
	"/_next",
	"/images",
	"/assets",
	"/static",
	"/vercel.svg",
];

export default withAuth(
	function middleware(req) {
		const token = req.nextauth.token;
		const path = req.nextUrl.pathname;
		const isApiRoute = path.startsWith("/api/");

		if (
			publicRoutes.some((route) => {
				if (path === route) return true;

				if (
					route.endsWith("/")
						? path.startsWith(route)
						: path.startsWith(`${route}/`) || path === route
				)
					return true;
				return false;
			})
		) {
			return NextResponse.next();
		}

		if (token && path.startsWith("/auth/signin")) {
			return NextResponse.redirect(new URL("/", req.url));
		}

		if (!token && isApiRoute) {
			if (req.method === "OPTIONS") {
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

			return new NextResponse(
				JSON.stringify({ error: "Authentication required" }),
				{
					status: 401,
					headers: {
						"content-type": "application/json",
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
					},
				},
			);
		}

		if (!token) {
			const signInUrl = new URL("/auth/signin", req.url);
			signInUrl.searchParams.set("callbackUrl", encodeURIComponent(req.url));
			return NextResponse.redirect(signInUrl);
		}

		const isAdminRoute = path.startsWith("/admin");
		const isAdminRole =
			token.role === "PATRON" ||
			token.role === "CO_PATRON" ||
			token.role === "DEVELOPER";

		if (isAdminRoute && !isAdminRole) {
			if (isApiRoute) {
				return new NextResponse(JSON.stringify({ error: "Access denied" }), {
					status: 403,
					headers: {
						"content-type": "application/json",
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
					},
				});
			}
			return NextResponse.redirect(new URL("/dashboard", req.url));
		}

		if (path.startsWith("/api/feedback")) {
			const isPostRequest = req.method === "POST";

			if (isPostRequest && token) {
			} else if (!isPostRequest && token.role !== "DEVELOPER") {
				return new NextResponse(JSON.stringify({ error: "Access denied" }), {
					status: 403,
					headers: {
						"content-type": "application/json",
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
						"Access-Control-Allow-Headers": "Content-Type, Authorization",
					},
				});
			}
		}

		const response = NextResponse.next();

		response.headers.set("Access-Control-Allow-Origin", "*");
		response.headers.set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		);
		response.headers.set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		);

		return response;
	},
	{
		callbacks: {
			authorized: ({ token }) => !!token,
		},
		pages: {
			signIn: "/auth/signin",
		},
	},
);

export const config = {
	matcher: [
		"/((?!api/auth/|auth/reset|auth/setup|_next/static|_next/image|favicon.ico|vercel.svg|assets/|images/|static/).*)",
	],
};
