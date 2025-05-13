import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Equipment, UserDTO } from "@/lib/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

// --- Equipment Card Component (Internal to EquipmentGrid) ---
interface EquipmentCardProps {
    item: Equipment;
    role: UserDTO["role"] | undefined;
    isMutating: boolean;
    currentUser: UserDTO | null;
    getStatusBadge: (status: Equipment["status"]) => React.ReactElement;
    handleEditEquipment: (item: Equipment) => void;
    setEquipmentToDelete: (id: string | null) => void;
    setIsDeleteDialogOpen: (isOpen: boolean) => void;
    measureRef?: (element: HTMLElement | null) => void;
    style?: React.CSSProperties;
}

function EquipmentCard({
    item,
    role,
    isMutating,
    currentUser,
    getStatusBadge,
    handleEditEquipment,
    setEquipmentToDelete,
    setIsDeleteDialogOpen,
    measureRef,
    style,
}: EquipmentCardProps) {
    const imageUrl = item.imagePath;
    const canManage =
        role === "SUPER_ADMIN" ||
        (["EQUIPMENT_OWNER", "MSDO", "OPC"].includes(role ?? "") &&
            item.equipmentOwner?.publicId === currentUser?.publicId);
    // Note: isMutatingItem check needs access to deleteMutation state, which is complex to pass.
    // We'll pass the general isMutating prop for now, which might disable actions slightly more broadly.
    // For fine-grained control, the mutation state would need to be managed differently or passed down.

    return (
        <div ref={measureRef} style={style}>
            <Card
                key={item.publicId}
                className="overflow-hidden h-full flex flex-col"
            >
                <CardHeader className="p-0 relative">
                    <img
                        src={imageUrl}
                        alt={item.name}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        {getStatusBadge(item.status)}
                        {item.availability ? (
                            <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700"
                            >
                                Available
                            </Badge>
                        ) : (
                            <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-600"
                            >
                                Unavailable
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <div className="flex justify-between items-start mb-1">
                        <CardTitle className="text-base leading-tight">
                            {item.name}
                        </CardTitle>
                        {canManage && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 flex-shrink-0 -mt-1 -mr-2"
                                        disabled={isMutating} // Use general isMutating
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleEditEquipment(item)
                                        }
                                        disabled={isMutating}
                                    >
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                            setEquipmentToDelete(item.publicId);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                        disabled={isMutating}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />{" "}
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <CardDescription className="text-xs">
                        Brand: {item.brand} | Qty: {item.quantity}
                    </CardDescription>
                    {role === "SUPER_ADMIN" && item.equipmentOwner && (
                        <CardDescription className="text-xs mt-1">
                            Owner: {item.equipmentOwner.firstName}{" "}
                            {item.equipmentOwner.lastName}
                        </CardDescription>
                    )}
                </CardContent>
                {/* Reserve button logic can be added here if needed, passed via props */}
            </Card>
        </div>
    );
}

// --- Equipment Grid Component ---
interface EquipmentGridProps {
    equipment: Equipment[];
    role: UserDTO["role"] | undefined;
    isMutating: boolean;
    currentUser: UserDTO | null;
    getStatusBadge: (status: Equipment["status"]) => React.ReactElement;
    handleEditEquipment: (item: Equipment) => void;
    setEquipmentToDelete: (id: string | null) => void;
    setIsDeleteDialogOpen: (isOpen: boolean) => void;
}

export function EquipmentGrid({
    equipment,
    role,
    isMutating,
    currentUser,
    getStatusBadge,
    handleEditEquipment,
    setEquipmentToDelete,
    setIsDeleteDialogOpen,
}: EquipmentGridProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [lanes, setLanes] = useState(5); // Default to a reasonable number
    const gap = 16; // Corresponds to gap-4
    const minCardWidth = 250; // Min width for equipment cards

    const virtualizer = useVirtualizer({
        count: equipment.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 330, // Rough estimate of card height
        overscan: 5,
        lanes: lanes,
        gap: 0, // Visual gap handled by padding
        getItemKey: (index) => equipment[index]?.publicId ?? index,
        measureElement: (element) => {
            if (element instanceof HTMLElement) {
                const style = window.getComputedStyle(element);
                // Consider paddingBottom which we add for spacing
                const paddingBottom =
                    Number.parseFloat(style.paddingBottom) || 0;
                // If elements have margin, include it too
                const marginBottom = Number.parseFloat(style.marginBottom) || 0;
                return element.offsetHeight + paddingBottom + marginBottom;
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
    }, [virtualizer]); // virtualizer is stable

    const virtualItems = virtualizer.getVirtualItems();

    const parentWidth = parentRef.current?.clientWidth ?? 0;
    const itemWidth =
        lanes > 0 && parentWidth > 0
            ? (parentWidth - (lanes - 1) * gap) / lanes
            : 0;

    return (
        <div
            ref={parentRef}
            // Adjust height based on your app layout
            className="h-[60vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted"
            style={{ contain: "strict" }}
        >
            {equipment.length > 0 ? (
                <div
                    className="w-full relative"
                    style={{ height: `${virtualizer.getTotalSize()}px` }}
                >
                    {virtualItems.map((virtualItem) => {
                        const item = equipment[virtualItem.index];
                        if (!item || itemWidth <= 0) return null;

                        const itemLeft = virtualItem.lane * (itemWidth + gap);

                        return (
                            <EquipmentCard
                                key={virtualItem.key} // Use virtualItem.key
                                item={item}
                                role={role}
                                isMutating={isMutating}
                                currentUser={currentUser}
                                getStatusBadge={getStatusBadge}
                                handleEditEquipment={handleEditEquipment}
                                setEquipmentToDelete={setEquipmentToDelete}
                                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                measureRef={virtualizer.measureElement}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: `${itemWidth}px`,
                                    transform: `translateY(${virtualItem.start}px) translateX(${itemLeft}px)`,
                                    paddingBottom: `${gap}px`, // Add gap below item
                                }}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    No equipment found.
                </div>
            )}
        </div>
    );
}
