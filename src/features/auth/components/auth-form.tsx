"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useAuthActions } from "@/hooks/api/use-auth-api";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type AuthMode = "login" | "signup";

const signupFormSchema = z.object({
	name: z.string().min(2),
	username: z.string().min(6).max(20),
	password: z.string().min(8),
});

const loginFormSchema = z.object({
	username: z.string().min(6).max(20),
	password: z.string().min(8),
});

type SignupValues = z.infer<typeof signupFormSchema>;
type LoginValues = z.infer<typeof loginFormSchema>;

export function AuthForm({
	mode,
	nextPath,
}: {
	mode: AuthMode;
	nextPath?: string;
}) {
	const router = useRouter();
	const { login, signup } = useAuthActions();
	const schema =
		mode === "signup" ? signupFormSchema : loginFormSchema;

	const form = useForm<SignupValues | LoginValues>({
		resolver: zodResolver(schema),
	});
	const {
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = form;
	const fieldErrors = errors as Record<
		string,
		{ message?: string }
	>;
	const getFieldError = (field: string) =>
		fieldErrors[field]?.message;

	const onSubmit = async (
		values: SignupValues | LoginValues,
	) => {
		try {
			if (mode === "signup") {
				await signup.mutateAsync(values as SignupValues);
			} else {
				await login.mutateAsync(values as LoginValues);
			}

			toast.success(
				mode === "signup" ? "Account created" : "Welcome back",
			);
			const destination = nextPath?.startsWith("/")
				? nextPath
				: "/";
			router.replace(destination);
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Authentication failed",
			);
		}
	};

	return (
		<Card className="mx-auto w-full max-w-md">
			<CardTitle className="mb-4 text-lg">
				{mode === "signup" ? "Create account" : "Login"}
			</CardTitle>
			<Form {...form}>
				<form
					className="space-y-3"
					onSubmit={handleSubmit(onSubmit)}
				>
					{mode === "signup" && (
						<FormField
							control={control}
							name={"name" as const}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage>{getFieldError("name")}</FormMessage>
								</FormItem>
							)}
						/>
					)}

					<FormField
						control={control}
						name={"username" as const}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username</FormLabel>
								<FormControl>
									<Input type="username" {...field} />
								</FormControl>
								<FormMessage>
									{getFieldError("username")}
								</FormMessage>
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name={"password" as const}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage>
									{getFieldError("password")}
								</FormMessage>
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						className="w-full"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<>
								<Spinner className="mr-2" />
								Please wait...
							</>
						) : mode === "signup" ? (
							"Sign up"
						) : (
							"Login"
						)}
					</Button>
				</form>
			</Form>
			<p className="mt-4 text-xs text-zinc-500">
				{mode === "signup"
					? "Already have an account?"
					: "Need an account?"}{" "}
				<Link
					href={
						mode === "signup" ? "/auth/login" : "/auth/signup"
					}
					className="underline"
				>
					{mode === "signup" ? "Login" : "Sign up"}
				</Link>
			</p>
		</Card>
	);
}
