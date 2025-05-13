import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserDTO, VenueDTO } from "@/lib/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    Edit,
    Eye,
    MapPin,
    MoreHorizontal,
    Trash2,
    UserCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// --- Venue Card Component for Grid View ---
interface VenueCardProps {
    venue: VenueDTO;
    isMutating: boolean;
    role: UserDTO["role"] | undefined;
    onNavigate: (id: string) => void;
    onEdit: (venue: VenueDTO) => void;
    onDelete: (id: string) => void;
    measureRef?: (element: HTMLElement | null) => void; // For virtualizer
    style?: React.CSSProperties; // For virtualizer positioning
}

function VenueCard({
    venue,
    isMutating,
    role,
    onNavigate,
    onEdit,
    onDelete,
    measureRef, // Added for virtualizer
    style, // Added for virtualizer
}: VenueCardProps) {
    return (
        <div ref={measureRef} style={style}>
            {" "}
            {/* Wrapper for virtualizer */}
            <Card
                key={venue.publicId}
                className="overflow-hidden flex flex-col group h-full"
            >
                <div className="aspect-video w-full overflow-hidden relative">
                    <img
                        src={venue.imagePath ?? undefined}
                        alt={venue.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                        }}
                        loading="lazy"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 opacity-80 group-hover:opacity-100"
                                disabled={isMutating}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Venue Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => onNavigate(venue.publicId)}
                            >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {role === "SUPER_ADMIN" && (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => onEdit(venue)}
                                    >
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => onDelete(venue.publicId)}
                                        disabled={isMutating}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />{" "}
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle
                        className="text-base font-semibold truncate"
                        title={venue.name}
                    >
                        {venue.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex-grow px-4 pb-3">
                    <div className="flex items-start gap-1.5 mb-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2" title={venue.location}>
                            {venue.location}
                        </span>
                    </div>
                    {venue.venueOwner && (
                        <div
                            className="flex items-start gap-1.5"
                            title={`${venue.venueOwner.firstName} ${venue.venueOwner.lastName}`}
                        >
                            <UserCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="truncate">
                                Owner: {venue.venueOwner.firstName}{" "}
                                {venue.venueOwner.lastName}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// --- Venue Grid Component ---
interface VenueGridProps {
    venues: VenueDTO[];
    isMutating: boolean;
    role: UserDTO["role"] | undefined;
    onNavigate: (id: string) => void;
    onEdit: (venue: VenueDTO) => void;
    onDelete: (id: string) => void;
}

export function VenueGrid({
    venues,
    isMutating,
    role,
    onNavigate,
    onEdit,
    onDelete,
}: VenueGridProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [lanes, setLanes] = useState(5);
    const gap = 16; // Corresponds to gap-4 / p-4 spacing
    const minCardWidth = 280; // Adjust as needed

    const virtualizer = useVirtualizer({
        count: venues.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 350, // Adjust estimate based on typical card height
        overscan: 5,
        lanes: lanes,
        gap: 0, // Visual gap handled by paddingBottom on the item wrapper
        getItemKey: (index) => venues[index]?.publicId ?? index,
        measureElement: (element) => {
            if (element instanceof HTMLElement) {
                const style = window.getComputedStyle(element);
                const marginBottom = Number.parseFloat(style.marginBottom) || 0;
                const paddingBottom =
                    Number.parseFloat(style.paddingBottom) || 0;
                return element.offsetHeight + marginBottom + paddingBottom;
            }
            return 0;
        },
    });

    useEffect(() => {
        const parentElement = parentRef.current;
        if (!parentElement) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const parentWidth = entry.contentBoxSize[0]?.inlineSize;
                if (parentWidth) {
                    const newLanes = Math.max(
                        1,
                        Math.floor((parentWidth + gap) / (minCardWidth + gap)),
                    );
                    setLanes(newLanes);
                    requestAnimationFrame(() => {
                        if (parentRef.current) virtualizer.measure();
                    });
                }
            }
        });

        resizeObserver.observe(parentElement);
        requestAnimationFrame(() => {
            if (parentRef.current) virtualizer.measure();
        });

        return () => {
            resizeObserver.disconnect();
        };
    }, [virtualizer]); // virtualizer is stable, effect runs on mount/unmount primarily

    const virtualItems = virtualizer.getVirtualItems();

    const parentWidth = parentRef.current?.clientWidth ?? 0;
    const itemWidth =
        lanes > 0 && parentWidth > 0
            ? (parentWidth - (lanes - 1) * gap) / lanes
            : 0;

    return (
        <div
            ref={parentRef}
            className="h-[60vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted"
            style={{ contain: "strict" }}
        >
            {venues.length > 0 ? (
                <div
                    className="w-full relative"
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                    }}
                >
                    {virtualItems.map((virtualItem) => {
                        const venue = venues[virtualItem.index];
                        if (!venue || itemWidth <= 0) return null;

                        const itemLeft = virtualItem.lane * (itemWidth + gap);

                        return (
                            <VenueCard
                                key={virtualItem.key}
                                venue={venue}
                                isMutating={isMutating}
                                role={role}
                                onNavigate={onNavigate}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                measureRef={virtualizer.measureElement}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: `${itemWidth}px`,
                                    // height: `${virtualItem.size}px`, // Height is determined by content + paddingBottom
                                    transform: `translateY(${virtualItem.start}px) translateX(${itemLeft}px)`,
                                    paddingBottom: `${gap}px`, // This creates the visual vertical gap
                                }}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                    No venues found.
                </div>
            )}
        </div>
    );
}
