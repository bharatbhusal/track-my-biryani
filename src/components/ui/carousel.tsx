"use client";

import * as React from "react";
import useEmblaCarousel, {
	type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];

type CarouselContextProps = {
	carouselRef: ReturnType<typeof useEmblaCarousel>[0];
	api: CarouselApi;
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(
	null,
);

function useCarousel() {
	const context = React.useContext(CarouselContext);
	if (!context) {
		throw new Error("useCarousel must be used within a Carousel");
	}
	return context;
}

function Carousel({ className, children }: React.ComponentProps<"div">) {
	const [carouselRef, api] = useEmblaCarousel({ loop: true });
	const [canScrollPrev, setCanScrollPrev] = React.useState(false);
	const [canScrollNext, setCanScrollNext] = React.useState(false);

	const onSelect = React.useCallback((currentApi: CarouselApi) => {
		if (!currentApi) return;
		setCanScrollPrev(currentApi.canScrollPrev());
		setCanScrollNext(currentApi.canScrollNext());
	}, []);

	React.useEffect(() => {
		if (!api) return;
		onSelect(api);
		api.on("reInit", onSelect);
		api.on("select", onSelect);
	}, [api, onSelect]);

	const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
	const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

	return (
		<CarouselContext.Provider
			value={{
				carouselRef,
				api,
				scrollPrev,
				scrollNext,
				canScrollPrev,
				canScrollNext,
			}}
		>
			<div className={cn("relative", className)}>{children}</div>
		</CarouselContext.Provider>
	);
}

function CarouselContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	const { carouselRef } = useCarousel();

	return (
		<div ref={carouselRef} className="overflow-hidden">
			<div
				className={cn("-ml-4 flex", className)}
				{...props}
			/>
		</div>
	);
}

function CarouselItem({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			role="group"
			aria-roledescription="slide"
			className={cn("min-w-0 shrink-0 grow-0 basis-full pl-4", className)}
			{...props}
		/>
	);
}

function CarouselPrevious({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	const { scrollPrev, canScrollPrev } = useCarousel();
	return (
		<Button
			variant="outline"
			size="icon"
			className={cn("absolute -left-3 top-1/2 -translate-y-1/2", className)}
			disabled={!canScrollPrev}
			onClick={scrollPrev}
			{...props}
		>
			<ChevronLeft className="h-4 w-4" />
			<span className="sr-only">Previous slide</span>
		</Button>
	);
}

function CarouselNext({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	const { scrollNext, canScrollNext } = useCarousel();
	return (
		<Button
			variant="outline"
			size="icon"
			className={cn("absolute -right-3 top-1/2 -translate-y-1/2", className)}
			disabled={!canScrollNext}
			onClick={scrollNext}
			{...props}
		>
			<ChevronRight className="h-4 w-4" />
			<span className="sr-only">Next slide</span>
		</Button>
	);
}

export {
	type CarouselApi,
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext,
};
