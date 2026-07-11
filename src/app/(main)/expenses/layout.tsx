export default function ExpensesLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="h-full space-y-4">{children}</div>;
}
