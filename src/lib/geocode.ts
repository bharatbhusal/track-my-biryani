export async function reverseGeocode(
	lat: number,
	lng: number,
): Promise<string> {
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
			{
				headers: {
					"User-Agent": "TrackMyBiryani/1.0",
				},
			},
		);
		if (!res.ok)
			return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
		const data = await res.json();
		return (
			data.display_name ??
			`${lat.toFixed(4)}, ${lng.toFixed(4)}`
		);
	} catch {
		return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
	}
}
