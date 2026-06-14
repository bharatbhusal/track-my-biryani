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
	if (!latitude || !longitude) return null;

	const zoom = 14;
	const src = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed&t=k`;

	return (
		<iframe
			title={address || "location"}
			src={src}
			width="100%"
			height={height}
			loading="lazy"
			style={{ border: 0 }}
		/>
	);
}
