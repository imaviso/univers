import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel, // Often needed for DataTableFilter
    getFacetedUniqueValues, // Often needed for DataTableFilter
    getFilteredRowModel, // Keep this
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    // Import filter function type if provided by Tanstack Table or your filter component
    // FilterFnOption,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    BuildingIcon, // Icon for Department
    CalendarIcon, // Icon for Last Active (Date)
    CheckCircleIcon, // Icon for Active Status
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FingerprintIcon, // Icon for ID Number
    ListFilterIcon, // Generic Filter Icon or for Status
    MoreHorizontal,
    UserIcon, // Icon for User Name
    UsersIcon, // Icon for Role
    XCircleIcon, // Icon for Inactive Status
} from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Remove the direct Input import if DataTableFilter handles all filtering
// import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// --- Import your custom filter components ---
// Adjust the import path as necessary
import { DataTableFilter } from "@/components/data-table-filter";
import { editDialogAtom, selectedUserAtom } from "@/lib/atoms";
import { defineMeta } from "@/lib/filters";
import { filterFn } from "@/lib/filters";
import { set } from "date-fns";
import { atom, useAtom } from "jotai";
// --- End Import ---
import { EditFormDialog } from "./editUserFormDialog";
import { UserFormDialog } from "./userFormDialog";

const initialUsers = [
    {
        id: 1,
        name: "John Doe",
        idNumber: "EMP-1001",
        email: "john.doe@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2024-05-01T10:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 2,
        name: "Jane Smith",
        idNumber: "EMP-1002",
        email: "jane.smith@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "active",
        lastActive: "2024-05-02T14:45:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 3,
        name: "Robert Johnson",
        idNumber: "EMP-1003",
        email: "robert.johnson@example.com",
        role: "User",
        department: "Marketing",
        status: "inactive",
        lastActive: "2024-04-15T09:20:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 4,
        name: "Emily Davis",
        idNumber: "EMP-1004",
        email: "emily.davis@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2024-05-03T11:10:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 5,
        name: "Michael Wilson",
        idNumber: "EMP-1005",
        email: "michael.wilson@example.com",
        role: "Manager",
        department: "Operations",
        status: "active",
        lastActive: "2024-05-01T16:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 6,
        name: "Sarah Connor",
        idNumber: "EMP-1006",
        email: "sarah.connor@example.com",
        role: "User",
        department: "Sales",
        status: "active",
        lastActive: "2025-04-02T09:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 7,
        name: "David Lee",
        idNumber: "EMP-1007",
        email: "david.lee@example.com",
        role: "Manager",
        department: "IT Department",
        status: "active",
        lastActive: "2025-04-03T11:20:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 8,
        name: "Laura Martinez",
        idNumber: "EMP-1008",
        email: "laura.martinez@example.com",
        role: "User",
        department: "Customer Support",
        status: "inactive",
        lastActive: "2025-02-10T15:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 9,
        name: "Kevin Garcia",
        idNumber: "EMP-1009",
        email: "kevin.garcia@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2025-03-28T17:05:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 10,
        name: "Olivia Rodriguez",
        idNumber: "EMP-1010",
        email: "olivia.rodriguez@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2025-04-01T08:45:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 11,
        name: "Daniel Brown",
        idNumber: "EMP-1011",
        email: "daniel.brown@example.com",
        role: "User",
        department: "Operations",
        status: "active",
        lastActive: "2025-04-03T10:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 12,
        name: "Chloe Taylor",
        idNumber: "EMP-1012",
        email: "chloe.taylor@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-04-03T13:15:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 13,
        name: "Matthew Anderson",
        idNumber: "EMP-1013",
        email: "matthew.anderson@example.com",
        role: "User",
        department: "Sales",
        status: "active",
        lastActive: "2025-03-30T14:55:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 14,
        name: "Sophia Thomas",
        idNumber: "EMP-1014",
        email: "sophia.thomas@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "inactive",
        lastActive: "2025-01-20T10:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 15,
        name: "Christopher Jackson",
        idNumber: "EMP-1015",
        email: "christopher.jackson@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2024-05-04T09:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 16,
        name: "Ava White",
        idNumber: "EMP-1016",
        email: "ava.white@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2024-05-05T12:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 17,
        name: "James Harris",
        idNumber: "EMP-1017",
        email: "james.harris@example.com",
        role: "User",
        department: "Operations",
        status: "inactive",
        lastActive: "2024-04-20T16:45:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 18,
        name: "Mia Martin",
        idNumber: "EMP-1018",
        email: "mia.martin@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2024-05-06T13:20:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 19,
        name: "Benjamin Thompson",
        idNumber: "EMP-1019",
        email: "benjamin.thompson@example.com",
        role: "Manager",
        department: "Sales",
        status: "active",
        lastActive: "2024-05-03T11:55:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 20,
        name: "Isabella Garcia",
        idNumber: "EMP-1020",
        email: "isabella.garcia@example.com",
        role: "User",
        department: "Human Resources",
        status: "active",
        lastActive: "2024-05-07T10:15:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 21,
        name: "Ethan Martinez",
        idNumber: "EMP-1021",
        email: "ethan.martinez@example.com",
        role: "User",
        department: "Customer Support",
        status: "active",
        lastActive: "2025-03-01T14:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 22,
        name: "Amelia Robinson",
        idNumber: "EMP-1022",
        email: "amelia.robinson@example.com",
        role: "User",
        department: "Marketing",
        status: "inactive",
        lastActive: "2025-02-15T17:20:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 23,
        name: "Alexander Clark",
        idNumber: "EMP-1023",
        email: "alexander.clark@example.com",
        role: "Manager",
        department: "Finance",
        status: "active",
        lastActive: "2025-04-05T09:10:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 24,
        name: "Scarlett Rodriguez",
        idNumber: "EMP-1024",
        email: "scarlett.rodriguez@example.com",
        role: "User",
        department: "Operations",
        status: "active",
        lastActive: "2025-04-06T12:45:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 25,
        name: "Joseph Lewis",
        idNumber: "EMP-1025",
        email: "joseph.lewis@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-04-07T15:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 26,
        name: "Victoria Walker",
        idNumber: "EMP-1026",
        email: "victoria.walker@example.com",
        role: "User",
        department: "Sales",
        status: "inactive",
        lastActive: "2025-03-20T11:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 27,
        name: "Henry Young",
        idNumber: "EMP-1027",
        email: "henry.young@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-04-08T10:20:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 28,
        name: "Grace Allen",
        idNumber: "EMP-1028",
        email: "grace.allen@example.com",
        role: "User",
        department: "Customer Support",
        status: "active",
        lastActive: "2025-04-09T13:55:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 29,
        name: "Samuel King",
        idNumber: "EMP-1029",
        email: "samuel.king@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2025-04-10T16:10:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 30,
        name: "Madison Wright",
        idNumber: "EMP-1030",
        email: "madison.wright@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2025-04-11T11:40:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 31,
        name: "Carter Lopez",
        idNumber: "EMP-1031",
        email: "carter.lopez@example.com",
        role: "Manager",
        department: "Operations",
        status: "inactive",
        lastActive: "2025-03-10T14:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 32,
        name: "Penelope Hill",
        idNumber: "EMP-1032",
        email: "penelope.hill@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-04-12T09:25:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 33,
        name: "Owen Scott",
        idNumber: "EMP-1033",
        email: "owen.scott@example.com",
        role: "User",
        department: "Sales",
        status: "active",
        lastActive: "2025-04-13T12:50:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 34,
        name: "Lily Green",
        idNumber: "EMP-1034",
        email: "lily.green@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-04-14T15:15:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 35,
        name: "Wyatt Baker",
        idNumber: "EMP-1035",
        email: "wyatt.baker@example.com",
        role: "User",
        department: "Customer Support",
        status: "active",
        lastActive: "2025-04-15T10:45:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 36,
        name: "Ella Adams",
        idNumber: "EMP-1036",
        email: "ella.adams@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2025-04-16T14:20:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 37,
        name: "Julian Nelson",
        idNumber: "EMP-1037",
        email: "julian.nelson@example.com",
        role: "User",
        department: "Finance",
        status: "inactive",
        lastActive: "2025-03-05T16:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 38,
        name: "Avery Carter",
        idNumber: "EMP-1038",
        email: "avery.carter@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-04-17T11:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 39,
        name: "Hazel Mitchell",
        idNumber: "EMP-1039",
        email: "hazel.mitchell@example.com",
        role: "Manager",
        department: "Sales",
        status: "active",
        lastActive: "2025-04-18T13:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 40,
        name: "Leo Roberts",
        idNumber: "EMP-1040",
        email: "leo.roberts@example.com",
        role: "User",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-04-19T16:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 41,
        name: "Nora Turner",
        idNumber: "EMP-1041",
        email: "nora.turner@example.com",
        role: "User",
        department: "Customer Support",
        status: "active",
        lastActive: "2025-04-20T10:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 42,
        name: "Sebastian Phillips",
        idNumber: "EMP-1042",
        email: "sebastian.phillips@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2025-04-21T14:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 43,
        name: "Luna Campbell",
        idNumber: "EMP-1043",
        email: "luna.campbell@example.com",
        role: "Manager",
        department: "Finance",
        status: "active",
        lastActive: "2025-04-22T17:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 44,
        name: "Elijah Parker",
        idNumber: "EMP-1044",
        email: "elijah.parker@example.com",
        role: "Administrator",
        department: "Operations",
        status: "active",
        lastActive: "2025-04-23T11:15:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 45,
        name: "Aurora Evans",
        idNumber: "EMP-1045",
        email: "aurora.evans@example.com",
        role: "User",
        department: "IT Department",
        status: "active",
        lastActive: "2025-04-24T13:45:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 46,
        name: "Caleb Edwards",
        idNumber: "EMP-1046",
        email: "caleb.edwards@example.com",
        role: "Manager",
        department: "Sales",
        status: "inactive",
        lastActive: "2025-03-15T15:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 47,
        name: "Nova Collins",
        idNumber: "EMP-1047",
        email: "nova.collins@example.com",
        role: "User",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-04-25T16:20:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 48,
        name: "Grayson Stewart",
        idNumber: "EMP-1048",
        email: "grayson.stewart@example.com",
        role: "User",
        department: "Customer Support",
        status: "active",
        lastActive: "2025-04-26T10:50:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 49,
        name: "Eleanor Flores",
        idNumber: "EMP-1049",
        email: "eleanor.flores@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2025-04-27T14:25:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 50,
        name: "Josiah Sanchez",
        idNumber: "EMP-1050",
        email: "josiah.sanchez@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2025-04-28T17:55:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 51,
        name: "Stella Morris",
        idNumber: "EMP-1051",
        email: "stella.morris@example.com",
        role: "Manager",
        department: "Operations",
        status: "active",
        lastActive: "2025-04-29T11:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 52,
        name: "Gabriel Rogers",
        idNumber: "EMP-1052",
        email: "gabriel.rogers@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-04-30T13:55:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 53,
        name: "Willow Reed",
        idNumber: "EMP-1053",
        email: "willow.reed@example.com",
        role: "User",
        department: "Sales",
        status: "active",
        lastActive: "2025-05-01T16:15:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 54,
        name: "Isaac Cook",
        idNumber: "EMP-1054",
        email: "isaac.cook@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-05-02T10:40:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 55,
        name: "Paisley Bell",
        idNumber: "EMP-1055",
        email: "paisley.bell@example.com",
        role: "User",
        department: "Customer Support",
        status: "inactive",
        lastActive: "2025-03-25T15:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 56,
        name: "Lincoln Murphy",
        idNumber: "EMP-1056",
        email: "lincoln.murphy@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2025-05-03T14:10:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 57,
        name: "Naomi Bailey",
        idNumber: "EMP-1057",
        email: "naomi.bailey@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2025-05-04T17:40:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 58,
        name: "Hudson Rivera",
        idNumber: "EMP-1058",
        email: "hudson.rivera@example.com",
        role: "Manager",
        department: "Operations",
        status: "active",
        lastActive: "2025-05-05T11:20:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 59,
        name: "Savannah Cooper",
        idNumber: "EMP-1059",
        email: "savannah.cooper@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-05-06T13:40:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 60,
        name: "Jaxon Richardson",
        idNumber: "EMP-1060",
        email: "jaxon.richardson@example.com",
        role: "User",
        department: "Sales",
        status: "active",
        lastActive: "2025-05-07T16:05:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 61,
        name: "Skylar Howard",
        idNumber: "EMP-1061",
        email: "skylar.howard@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-05-08T10:35:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 62,
        name: "Easton Ward",
        idNumber: "EMP-1062",
        email: "easton.ward@example.com",
        role: "User",
        department: "Customer Support",
        status: "active",
        lastActive: "2025-05-09T14:05:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 63,
        name: "Autumn Peterson",
        idNumber: "EMP-1063",
        email: "autumn.peterson@example.com",
        role: "User",
        department: "Marketing",
        status: "inactive",
        lastActive: "2025-03-30T17:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 64,
        name: "Everett Gray",
        idNumber: "EMP-1064",
        email: "everett.gray@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2025-05-10T17:35:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 65,
        name: "Brooklyn Ramirez",
        idNumber: "EMP-1065",
        email: "brooklyn.ramirez@example.com",
        role: "Manager",
        department: "Operations",
        status: "active",
        lastActive: "2025-05-11T11:10:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 66,
        name: "Waylon James",
        idNumber: "EMP-1066",
        email: "waylon.james@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-05-12T13:35:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 67,
        name: "Ariana Watson",
        idNumber: "EMP-1067",
        email: "ariana.watson@example.com",
        role: "User",
        department: "Sales",
        status: "active",
        lastActive: "2025-05-13T15:55:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 68,
        name: "Bennett Brooks",
        idNumber: "EMP-1068",
        email: "bennett.brooks@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-05-14T10:25:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 69,
        name: "Madelyn Kelly",
        idNumber: "EMP-1069",
        email: "madelyn.kelly@example.com",
        role: "User",
        department: "Customer Support",
        status: "active",
        lastActive: "2025-05-15T13:50:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 70,
        name: "Declan Sanders",
        idNumber: "EMP-1070",
        email: "declan.sanders@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2025-05-16T17:25:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 71,
        name: "Riley Price",
        idNumber: "EMP-1071",
        email: "riley.price@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2025-05-17T11:05:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 72,
        name: "Connor Bennett",
        idNumber: "EMP-1072",
        email: "connor.bennett@example.com",
        role: "Manager",
        department: "Operations",
        status: "active",
        lastActive: "2025-05-18T13:25:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 73,
        name: "Zoey Wood",
        idNumber: "EMP-1073",
        email: "zoey.wood@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-05-19T15:45:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 74,
        name: "Chase Barnes",
        idNumber: "EMP-1074",
        email: "chase.barnes@example.com",
        role: "User",
        department: "Sales",
        status: "active",
        lastActive: "2025-05-20T10:15:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 75,
        name: "Aubrey Ross",
        idNumber: "EMP-1075",
        email: "aubrey.ross@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-05-21T13:40:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 76,
        name: "Miles Henderson",
        idNumber: "EMP-1076",
        email: "miles.henderson@example.com",
        role: "User",
        department: "Customer Support",
        status: "inactive",
        lastActive: "2025-04-05T16:00:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 77,
        name: "Addison Coleman",
        idNumber: "EMP-1077",
        email: "addison.coleman@example.com",
        role: "User",
        department: "Marketing",
        status: "active",
        lastActive: "2025-05-22T17:15:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 78,
        name: "Brody Powell",
        idNumber: "EMP-1078",
        email: "brody.powell@example.com",
        role: "User",
        department: "Finance",
        status: "active",
        lastActive: "2025-05-23T10:55:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 79,
        name: "Kennedy Long",
        idNumber: "EMP-1079",
        email: "kennedy.long@example.com",
        role: "Manager",
        department: "Operations",
        status: "active",
        lastActive: "2025-05-24T13:15:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 80,
        name: "Colton Patterson",
        idNumber: "EMP-1080",
        email: "colton.patterson@example.com",
        role: "Administrator",
        department: "IT Department",
        status: "active",
        lastActive: "2025-05-25T15:35:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 81,
        name: "Angel Myers",
        idNumber: "EMP-1081",
        email: "angel.myers@example.com",
        role: "User",
        department: "Sales",
        status: "active",
        lastActive: "2025-05-26T10:05:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 82,
        name: "Alexis Foster",
        idNumber: "EMP-1082",
        email: "alexis.foster@example.com",
        role: "Manager",
        department: "Human Resources",
        status: "active",
        lastActive: "2025-05-27T13:30:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    {
        id: 83,
        name: "Parker Butler",
        idNumber: "EMP-1083",
        email: "parker.butler@example.com",
        role: "User",
        department: "Customer Support",
        status: "active",
        lastActive: "2025-05-28T16:55:00Z",
        avatar: "/placeholder.svg?height=40&width=40",
    },
];
// Define the User type (remains the same)
export type User = {
    id: number;
    name: string;
    idNumber: string;
    email: string;
    role: string;
    department: string;
    status: "active" | "inactive";
    lastActive: string;
    avatar: string;
};

// Use the actual user data
const data: User[] = initialUsers;

// --- Define Options for Filters ---
const STATUS_OPTIONS = [
    { value: "active", label: "Active", icon: CheckCircleIcon },
    { value: "inactive", label: "Inactive", icon: XCircleIcon },
];

// Dynamically generate options or define manually if fixed
const ROLE_OPTIONS = Array.from(new Set(initialUsers.map((u) => u.role))).map(
    (role) => ({
        value: role,
        label: role,
        // Assign icons based on role if desired
        // icon: role === 'Administrator' ? AdminIcon : role === 'Manager' ? ManagerIcon : UserIcon
    }),
);

const DEPARTMENT_OPTIONS = Array.from(
    new Set(initialUsers.map((u) => u.department)),
).map((dep) => ({
    value: dep,
    label: dep,
    icon: BuildingIcon, // Use a generic icon or assign specific ones
}));
// --- End Options ---

// --- Define the columns with filter metadata ---
export const columns: ColumnDef<User>[] = [
    {
        id: "select",
        // Header and Cell remain the same...
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column } /* Sort button... */) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                User
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            /* User Avatar/Name/Email cell... */
            const user = row.original;
            const getInitials = (name: string) =>
                name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();
            return (
                <div className="flex items-center space-x-3">
                    <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                            {user.email}
                        </div>
                    </div>
                </div>
            );
        },
        // --- Filter Config ---
        filterFn: filterFn("text"), // Use the provided filter function for text
        meta: defineMeta((row) => row.name, {
            // Use the helper to define metadata
            displayName: "User Name", // Label used in the filter UI
            type: "text", // Type of filter input
            icon: UserIcon, // Icon shown next to the filter option
        }),
        // --- End Filter Config ---
    },
    {
        accessorKey: "idNumber",
        header: "ID Number",
        cell: ({ row }) => <div>{row.getValue("idNumber")}</div>,
        // --- Filter Config ---
        filterFn: filterFn("text"),
        meta: defineMeta((row) => row.idNumber, {
            displayName: "ID Number",
            type: "text",
            icon: FingerprintIcon,
        }),
        // --- End Filter Config ---
    },
    {
        accessorKey: "role",
        header: ({ column } /* Sort button... */) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Role
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("role")}</div>
        ),
        // --- Filter Config ---
        filterFn: filterFn("option"),
        meta: defineMeta((row) => row.role, {
            displayName: "Role",
            type: "option",
            icon: UsersIcon,
            options: ROLE_OPTIONS, // Provide the predefined options
        }),
        // --- End Filter Config ---
    },
    {
        accessorKey: "department",
        header: ({ column } /* Sort button... */) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                Department
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("department")}</div>,
        // --- Filter Config ---
        filterFn: filterFn("option"),
        meta: defineMeta((row) => row.department, {
            displayName: "Department",
            type: "option",
            icon: BuildingIcon,
            options: DEPARTMENT_OPTIONS,
        }),
        // --- End Filter Config ---
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row } /* Badge cell... */) => (
            <Badge
                variant={
                    row.getValue("status") === "active" ? "default" : "outline"
                }
                className="capitalize"
            >
                {row.getValue("status")}
            </Badge>
        ),
        // --- Filter Config ---
        filterFn: filterFn("option"), // Use 'option' for selecting 'active'/'inactive'
        meta: defineMeta((row) => row.status, {
            displayName: "Status",
            type: "option",
            icon: ListFilterIcon,
            options: STATUS_OPTIONS, // Provide the active/inactive options
        }),
        // --- End Filter Config ---
    },
    {
        accessorKey: "lastActive",
        header: ({ column } /* Right-aligned Sort button... */) => (
            <div className="text-right">
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Last Active
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            </div>
        ),
        cell: ({ row }) => {
            /* Formatted date cell... */
            const date = new Date(row.getValue("lastActive"));
            const formatted = new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);
            return <div className="text-right font-medium">{formatted}</div>;
        },
        // --- Filter Config (Optional - If your filter supports date) ---
        filterFn: filterFn("date"), // Assuming 'date' type exists
        meta: defineMeta((row) => new Date(row.lastActive), {
            // Pass Date object if needed
            displayName: "Last Active",
            type: "date",
            icon: CalendarIcon,
        }),
        // --- End Filter Config ---
    },
    {
        id: "actions",
        // Cell remains the same...
        cell: ({ row }) => {
            /* Actions DropdownMenu... */
            const user = row.original;
            const [, setEditDialogOpen] = useAtom(editDialogAtom);
            const [, setSelectedUser] = useAtom(selectedUserAtom);
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => {
                                setEditDialogOpen(true);
                                setSelectedUser(user);
                            }}
                        >
                            Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                console.log(`Viewing details for: ${user.id}`)
                            }
                        >
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                                console.log(`Deactivating user: ${user.id}`)
                            }
                        >
                            Deactivate User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
        enableHiding: false, // Keep actions always visible
    },
];

// The main DataTable component
export function UserDataTable() {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [editDialogOpen, setEditDialogOpen] = useAtom(editDialogAtom);
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    const table = useReactTable({
        data,
        columns,
        state: {
            // Order matters for state dependencies
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        // --- Enable features needed by DataTableFilter ---
        onColumnFiltersChange: setColumnFilters, // Connect filter state
        getFilteredRowModel: getFilteredRowModel(), // Basic filtering
        getFacetedRowModel: getFacetedRowModel(), // Needed for list-based filters
        getFacetedUniqueValues: getFacetedUniqueValues(), // Needed for list-based filters
        // --- End Enable features ---
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        // Optional: Define column meta globally if needed, though per-column is shown above
        // meta: {},
        // debugTable: true, // Uncomment for debugging
        // debugHeaders: true,
        // debugColumns: true,
    });

    return (
        <div className="w-full space-y-4">
            {/* Column Visibility Dropdown (Keep if DataTableFilter doesn't handle it) */}
            <div className="flex items-center justify-end">
                {" "}
                {/* Add spacing */}
                {/* --- Add the custom filter component --- */}
                <DataTableFilter table={table} />
                {/* --- Remove the old simple filter input --- */}
                {/*
      <div className="flex items-center py-4">
        <Input placeholder="Filter names..." ... />
        <DropdownMenu>...</DropdownMenu> // Column visibility can stay if DataTableFilter doesn't handle it
      </div>
      */}
                {Object.keys(table.getState().rowSelection).length > 0 && (
                    <Button
                        variant="destructive"
                        className="ml-2 h-7 !px-2"
                        onClick={() => {
                            const selectedRowIds = Object.keys(
                                table.getState().rowSelection,
                            );
                            console.log(
                                "Deleting rows with ids:",
                                selectedRowIds,
                            );
                            // TODO: Add deletion logic here
                        }}
                    >
                        Delete
                    </Button>
                )}
                {/* Position it */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-2">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide()) // Filter out non-hidable columns (select, actions)
                            .map((column) => {
                                // Use displayName from meta if available, otherwise format ID
                                const displayName =
                                    (
                                        column.columnDef.meta as
                                            | { displayName?: string }
                                            | undefined
                                    )?.displayName || column.id;
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {displayName}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {/* --- Table Rendering (remains mostly the same) --- */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                        >
                                            {" "}
                                            {/* Add colSpan */}
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length} // Use dynamic colspan
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* --- Pagination and Selection Count (remains the same) --- */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                        Showing{" "}
                        <strong>
                            {table.getState().pagination.pageIndex *
                                table.getState().pagination.pageSize +
                                1}
                            -
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) *
                                    table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length,
                            )}
                        </strong>{" "}
                        of{" "}
                        <strong>
                            {table.getFilteredRowModel().rows.length}
                        </strong>{" "}
                        results
                    </p>
                    <Select
                        value={table.getState().pagination.pageSize.toString()}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue
                                placeholder={
                                    table.getState().pagination.pageSize
                                }
                            />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem
                                    key={pageSize}
                                    value={pageSize.toString()}
                                >
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                            table.setPageIndex(table.getPageCount() - 1)
                        }
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <EditFormDialog
                isOpen={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedUser(null); // Clear selected user on close
                }}
                onSubmit={(userData) => {
                    // Handle the form submission (e.g., update the user data)
                    console.log("Updated user data:", userData);
                    setEditDialogOpen(false);
                    setSelectedUser(null);
                    // TODO: Implement the actual update logic here
                }}
                user={selectedUser!} // Pass the selected user
                roles={ROLE_OPTIONS}
                departments={Array.from(new Set(data.map((u) => u.department)))}
                active={STATUS_OPTIONS}
            />
        </div>
    );
}
