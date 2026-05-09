import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, ms = 300) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), ms);
		return () => clearTimeout(id);
	}, [value, ms]);

	return debounced;
}
