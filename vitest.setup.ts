import path from "node:path";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import "@testing-library/jest-dom";
import React, { type SVGProps } from "react";
import { vi } from "vitest";

// Create a dummy SVG element renderer
const createSvgElement = (props: SVGProps<SVGSVGElement>) =>
	React.createElement("svg", props);
// Proxy handler that returns the same SVG for any icon
const svgProxyHandler = { get: () => createSvgElement };

// Mock lucide-react and heroicons icons
vi.mock("lucide-react", () => new Proxy({}, svgProxyHandler));
vi.mock("@heroicons/react/24/outline", () => new Proxy({}, svgProxyHandler));

// Mock Next.js navigation functions
Object.defineProperty(globalThis, "scrollTo", {
	value: vi.fn(),
	writable: true,
});

// Global mocks for Next.js
vi.mock("next/navigation", async () => {
	const actual = await vi.importActual("next/navigation");
	return {
		...actual,
		useRouter: vi.fn(() => ({
			push: vi.fn(),
			replace: vi.fn(),
			prefetch: vi.fn(),
			back: vi.fn(),
		})),
		useSearchParams: vi.fn(() => ({ get: vi.fn() })),
		usePathname: vi.fn(() => "/"),
	};
});

// Mock for globalThis.requestAnimationFrame
globalThis.requestAnimationFrame = vi.fn((callback) => {
	callback(0);
	return 0;
});

globalThis.scrollY = 0;
