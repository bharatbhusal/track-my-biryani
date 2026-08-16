"use client";

import React from "react";

type Props = {
	latitude: number;
	longitude: number;
	address?: string;
	height?: number;
};

export default function GoogleMap({
	latitude,
	longitude,
	address,
	height = 320,
}: Props) {
	// ponytail: 0 is a legitimate coordinate — guard on finiteness, and on the
	// {0,0} "no location" sentinel, not on falsiness.
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
		return null;
	if (latitude === 0 && longitude === 0) return null;

	const zoom = 14;
	const src = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed&t=k`;

	return (
		<iframe
			title={address || "location"}
			src={src}
			width="100%"
			height={height}
			loading="lazy"
			style={{ border: 0, borderRadius: "1rem" }}
		/>
	);
}
