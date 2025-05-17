import { motion } from "framer-motion";
import type React from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { WeaponStats } from "./types";
import { chartVariants } from "./utils";

interface WeaponsTabProps {
	weaponStats: WeaponStats;
}

const WeaponsTab: React.FC<WeaponsTabProps> = ({ weaponStats }) => {
	return (
		<motion.div
			role="tabpanel"
			aria-labelledby="weapons-tab"
			id="weapons-panel"
			initial="hidden"
			animate="visible"
			exit="hidden"
			variants={{
				hidden: { opacity: 0 },
				visible: {
					opacity: 1,
					transition: {
						staggerChildren: 0.2,
					},
				},
			}}
			className="space-y-6"
		>
			<motion.div
				variants={chartVariants}
				className="rounded-xl border border-zinc-200 bg-background p-6 shadow-lg backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800"
			>
				<h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-white">
					Ventes quotidiennes
				</h3>
				<div className="h-80">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={weaponStats.dailyStats}>
							<defs>
								<linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
									<stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="#d1d5db"
								className="dark:stroke-zinc-600"
							/>
							<XAxis
								dataKey="day"
								stroke="#4b5563"
								className="dark:text-zinc-300"
							/>
							<YAxis stroke="#4b5563" className="dark:text-zinc-300" />
							<Tooltip
								contentStyle={{
									backgroundColor:
										"var(--tooltip-bg, rgba(255, 255, 255, 0.8))",
									backdropFilter: "blur(8px)",
									borderRadius: "8px",
									border: "var(--tooltip-border, 1px solid #d1d5db)",
									color: "var(--tooltip-color, #1f2937)",
								}}
							/>
							<Area
								type="monotone"
								dataKey="count"
								name="Nombre d'armes"
								stroke="#ef4444"
								fillOpacity={1}
								fill="url(#colorCount)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</motion.div>

			<motion.div
				variants={chartVariants}
				className="rounded-xl border border-zinc-200 bg-background p-6 shadow-lg backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800"
			>
				<h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-white">
					Types d&apos;armes vendues
				</h3>
				<div className="h-80">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={weaponStats.weaponTypes}
								dataKey="count"
								nameKey="name"
								cx="50%"
								cy="50%"
								outerRadius={100}
								label
							>
								{weaponStats.weaponTypes.map((type) => (
									<Cell
										key={`cell-${type.name}`}
										fill={
											type.name === "M4A1"
												? "hsl(150, 85%, 55%)"
												: type.name === "AK-47"
													? "hsl(200, 85%, 55%)"
													: type.name === "AWP"
														? "hsl(250, 85%, 55%)"
														: "hsl(300, 85%, 55%)"
										}
										className="focus:outline-none"
									/>
								))}
							</Pie>
							<Tooltip
								contentStyle={{
									backgroundColor:
										"var(--tooltip-bg, rgba(255, 255, 255, 0.8))",
									backdropFilter: "blur(8px)",
									borderRadius: "8px",
									border: "var(--tooltip-border, 1px solid #d1d5db)",
									color: "var(--tooltip-color, #1f2937)",
								}}
							/>
							<Legend className="dark:text-zinc-300" />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</motion.div>
		</motion.div>
	);
};

export default WeaponsTab;
