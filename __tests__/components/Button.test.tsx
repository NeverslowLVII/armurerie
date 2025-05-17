import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

// Composant Button simple pour tests
interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: "primary" | "secondary" | "danger";
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	className?: string;
}

const Button: React.FC<ButtonProps> = ({
	children,
	onClick,
	variant = "primary",
	disabled = false,
	type = "button",
	className = "",
}) => {
	const baseClasses =
		"px-4 py-2 rounded font-medium focus:outline-none transition-colors";
	const variantClasses = {
		primary: "bg-red-500 text-white hover:bg-red-600",
		secondary: "bg-zinc-200 text-zinc-800 hover:bg-zinc-300",
		danger: "bg-red-500 text-white hover:bg-red-600",
	};

	const classes = `${baseClasses} ${variantClasses[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`;

	return (
		<button
			type={type}
			className={classes}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
};

// Tests
describe("Button Component", () => {
	it("renders correctly with children", () => {
		render(<Button>Click Me</Button>);
		expect(screen.getByText("Click Me")).toBeDefined();
	});

	it("applies the primary variant by default", () => {
		render(<Button>Primary Button</Button>);
		const button = screen.getByText("Primary Button");
		expect(button.className).toContain("bg-red-500");
	});

	it("applies the secondary variant when specified", () => {
		render(<Button variant="secondary">Secondary Button</Button>);
		const button = screen.getByText("Secondary Button");
		expect(button.className).toContain("bg-zinc-200");
	});

	it("applies the danger variant when specified", () => {
		render(<Button variant="danger">Danger Button</Button>);
		const button = screen.getByText("Danger Button");
		expect(button.className).toContain("bg-red-500");
	});

	it("disables the button when disabled is true", () => {
		render(<Button disabled>Disabled Button</Button>);
		const button = screen.getByText("Disabled Button");
		expect(button).toBeDisabled();
		expect(button.className).toContain("opacity-50");
	});

	it("calls onClick when clicked", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Clickable Button</Button>);
		const button = screen.getByText("Clickable Button");

		fireEvent.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("does not call onClick when disabled and clicked", () => {
		const handleClick = vi.fn();
		render(
			<Button onClick={handleClick} disabled>
				Disabled Clickable Button
			</Button>,
		);
		const button = screen.getByText("Disabled Clickable Button");

		fireEvent.click(button);

		expect(handleClick).not.toHaveBeenCalled();
	});

	it("sets the correct button type", () => {
		render(<Button type="submit">Submit Button</Button>);
		const button = screen.getByText("Submit Button");
		expect(button).toHaveAttribute("type", "submit");
	});
});
