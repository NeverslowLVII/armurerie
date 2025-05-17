"use client";

import SignInPage from "@/components/auth/SignInPage";
import { FullPageSkeletonLoading } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function Page() {
	return (
		<Suspense
			fallback={
				<FullPageSkeletonLoading>
					<div className="space-y-6">
						<Skeleton className="mx-auto h-12 w-64" />
						<Skeleton className="mx-auto h-6 w-full max-w-md" />
						<div className="mx-auto max-w-md space-y-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					</div>
				</FullPageSkeletonLoading>
			}
		>
			<SignInPage />
		</Suspense>
	);
}
