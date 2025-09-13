import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseDate } from "chrono-node";
import { Calendar as CalendarIcon } from "lucide-react";
import React from "react";
import type { DayPickerSingleProps } from "react-day-picker";
import { Scroller } from "./scroller";

/* -------------------------------------------------------------------------- */
/*                               Inspired By:                                 */
/*                               @steventey                                   */
/* ------------------https://dub.co/blog/smart-datetime-picker--------------- */
/* -------------------------------------------------------------------------- */

/**
 * Utility function that parses dates.
 * Parses a given date string using the `chrono-node` library.
 *
 * @param str - A string representation of a date and time.
 * @returns A `Date` object representing the parsed date and time, or `null` if the string could not be parsed.
 */
export const parseDateTime = (str: Date | string) => {
    if (str instanceof Date) return str;
    return parseDate(str);
};

/**
 * Converts a given timestamp or the current date and time to a string representation in the local time zone.
 * format: `HH:mm`, adjusted for the local time zone.
 *
 * @param timestamp {Date | string}
 * @returns A string representation of the timestamp
 */
export const getDateTimeLocal = (timestamp?: Date): string => {
    const d = timestamp ? new Date(timestamp) : new Date();
    if (d.toString() === "Invalid Date") return "";
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .split(":")
        .slice(0, 2)
        .join(":");
};

/**
 * Returns the earliest date (starting with today) that is not disabled by the matcher.
 * If no dates are `disabled`, we default to new Date().
 *
 * @param disabled - A boolean disabling the entire input, or a matcher function for valid dates.
 * @returns A `Date` object representing the earliest valid date.
 */
const getValidBaseDate = (
    disabled?: boolean | ((date: Date) => boolean),
): Date => {
    if (typeof disabled !== "function") return new Date();
    let potential = new Date();
    const MAX_DAYS = 365;
    for (let i = 0; i < MAX_DAYS; i++) {
        if (!disabled(potential)) {
            return potential;
        }
        potential = new Date(potential.getTime());
        potential.setDate(potential.getDate() + 1);
    }
    return new Date();
};

/**
 * Formats a given date and time object or string into a human-readable string representation.
 * "MMM D, YYYY h:mm A" (e.g. "Jan 1, 2023 12:00 PM").
 *
 * @param datetime - {Date | string}
 * @returns A string representation of the date and time
 */
export const formatDateTime = (datetime: Date | string) => {
    return new Date(datetime).toLocaleTimeString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    });
};

const inputBase =
    "bg-transparent focus:outline-none focus:ring-0 focus-within:outline-none focus-within:ring-0 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50";

// @source: https://www.perplexity.ai/search/in-javascript-how-RfI7fMtITxKr5c.V9Lv5KA#1
// use this pattern to validate the transformed date string for the natural language input
// const naturalInputValidationPattern =
//     "^[A-Z][a-z]{2}sd{1,2},sd{4},sd{1,2}:d{2}s[AP]M$";

// Adjust DEFAULT_SIZE for 30-minute increments (24 hours * 2 slots/hour)
// const DEFAULT_SIZE = 48;

/**
 * Smart time input Docs: {@link: https://shadcn-extension.vercel.app/docs/smart-time-input}
 */

interface SmartDatetimeInputProps {
    value?: Date;
    onValueChange: (date: Date) => void;
    disabled?: boolean | ((date: Date) => boolean);
}

interface SmartDatetimeInputContextProps extends SmartDatetimeInputProps {
    Time: string;
    onTimeChange: (time: string) => void;
}

const SmartDatetimeInputContext =
    React.createContext<SmartDatetimeInputContextProps | null>(null);

const useSmartDateInput = () => {
    const context = React.useContext(SmartDatetimeInputContext);
    if (!context) {
        throw new Error(
            "useSmartDateInput must be used within SmartDateInputProvider",
        );
    }
    return context;
};

export const SmartDatetimeInput = React.forwardRef<
    HTMLInputElement,
    Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "disabled" | "type" | "ref" | "value" | "defaultValue" | "onBlur"
    > &
        SmartDatetimeInputProps
>(({ className, value, onValueChange, placeholder, disabled }, ref) => {
    const [Time, setTime] = React.useState<string>("");

    const onTimeChange = React.useCallback((time: string) => {
        setTime(time);
    }, []);

    return (
        <SmartDatetimeInputContext.Provider
            value={{ value, onValueChange, Time, onTimeChange, disabled }}
        >
            <div className="flex items-center justify-center">
                <div
                    className={cn(
                        "flex gap-1 w-full p-1 items-center justify-between rounded-md border transition-all",
                        "focus-within:outline-0 focus:outline-0 focus:ring-0",
                        "placeholder:text-muted-foreground focus-visible:outline-0 ",
                        className,
                    )}
                >
                    <DateTimeLocalInput disabled={disabled} />
                    <NaturalLanguageInput
                        placeholder={placeholder}
                        disabled={
                            typeof disabled === "boolean" ? disabled : false
                        }
                        ref={ref}
                    />
                </div>
            </div>
        </SmartDatetimeInputContext.Provider>
    );
});

SmartDatetimeInput.displayName = "DatetimeInput";

// Make it a standalone component

const TimePicker = () => {
    const { value, onValueChange, Time, onTimeChange, disabled } =
        useSmartDateInput();
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const timestamp = 30;

    const formatSelectedTime = React.useCallback(
        (time: string, hour: number, partStamp: number) => {
            onTimeChange(time);

            const base = value ? new Date(value) : getValidBaseDate(disabled);
            const newVal = parseDateTime(base);

            if (!newVal) return;

            newVal.setHours(hour, partStamp * timestamp);

            onValueChange(newVal);
        },
        [value, onValueChange, onTimeChange, disabled],
    );

    // const handleKeydown = React.useCallback(
    //     (e: React.KeyboardEvent<HTMLDivElement>) => {
    //         e.stopPropagation();

    //         if (!document) return;

    //         const moveNext = () => {
    //             const nextIndex =
    //                 activeIndex + 1 > DEFAULT_SIZE - 1 ? 0 : activeIndex + 1;

    //             const currentElm = document.getElementById(`time-${nextIndex}`);

    //             currentElm?.focus();

    //             setActiveIndex(nextIndex);
    //         };

    //         const movePrev = () => {
    //             const prevIndex =
    //                 activeIndex - 1 < 0 ? DEFAULT_SIZE - 1 : activeIndex - 1;

    //             const currentElm = document.getElementById(`time-${prevIndex}`);

    //             currentElm?.focus();

    //             setActiveIndex(prevIndex);
    //         };

    //         const setElement = () => {
    //             const currentElm = document.getElementById(
    //                 `time-${activeIndex}`,
    //             );

    //             if (!currentElm) return;

    //             currentElm.focus();

    //             const timeValue = currentElm.textContent ?? "";

    //             const PM_AM = timeValue.split(" ")[1];
    //             const PM_AM_hour = Number.parseInt(
    //                 timeValue.split(" ")[0].split(":")[0],
    //             );
    //             const hour =
    //                 PM_AM === "AM"
    //                     ? PM_AM_hour === 12
    //                         ? 0
    //                         : PM_AM_hour
    //                     : PM_AM_hour === 12
    //                       ? 12
    //                       : PM_AM_hour + 12;

    //             const part =
    //                 Number.parseInt(timeValue.split(" ")[0].split(":")[1]) === 0
    //                     ? 0
    //                     : 1;

    //             formatSelectedTime(timeValue, hour, part);
    //         };

    //         const reset = () => {
    //             const currentElm = document.getElementById(
    //                 `time-${activeIndex}`,
    //             );
    //             currentElm?.blur();
    //             setActiveIndex(-1);
    //         };

    //         switch (e.key) {
    //             case "ArrowUp":
    //                 movePrev();
    //                 break;

    //             case "ArrowDown":
    //                 moveNext();
    //                 break;

    //             case "Escape":
    //                 reset();
    //                 break;

    //             case "Enter":
    //                 setElement();
    //                 break;
    //         }
    //     },
    //     [activeIndex, formatSelectedTime],
    // );

    const handleClick = React.useCallback(
        (hour: number, part: number, PM_AM: string, currentIndex: number) => {
            formatSelectedTime(
                `${hour}:${part === 0 ? "00" : timestamp} ${PM_AM}`,
                hour,
                part,
            );
            setActiveIndex(currentIndex);
        },
        [formatSelectedTime],
    );

    const currentTime = React.useMemo(() => {
        const timeVal = Time.split(" ")[0];
        return {
            hours: Number.parseInt(timeVal.split(":")[0]),
            minutes: Number.parseInt(timeVal.split(":")[1]),
        };
    }, [Time]);

    React.useEffect(() => {
        const getCurrentElementTime = () => {
            const timeVal = Time.split(" ")[0];
            const hours = Number.parseInt(timeVal.split(":")[0]);
            const minutes = Number.parseInt(timeVal.split(":")[1]);
            const PM_AM = Time.split(" ")[1];

            const formatIndex =
                PM_AM === "AM" ? hours : hours === 12 ? hours : hours + 12;
            const formattedHours = formatIndex;

            for (let j = 0; j <= 1; j++) {
                const diff = Math.abs(j * timestamp - minutes);
                const selected =
                    PM_AM === (formattedHours >= 12 ? "PM" : "AM") && diff < 15;

                if (selected) {
                    const trueIndex =
                        activeIndex === -1
                            ? formattedHours * 2 + j
                            : activeIndex;

                    setActiveIndex(trueIndex);

                    const currentElm = document.getElementById(
                        `time-${trueIndex}`,
                    );
                    currentElm?.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                    });
                }
            }
        };

        getCurrentElementTime();
    }, [Time, activeIndex]);

    const height = React.useMemo(() => {
        if (!document) return;
        const calendarElm = document.getElementById("calendar");
        if (!calendarElm) return;
        return calendarElm.style.height;
    }, []);

    return (
        <div className="space-y-2 pr-3 py-3 relative ">
            <h3 className="text-sm font-medium ">Time</h3>
            <Scroller
                withNavigation
                scrollTriggerMode="press"
                style={{
                    height,
                }}
            >
                <ul
                    className={cn(
                        "flex items-center flex-col gap-1 h-full max-h-56 w-28 px-1 py-0.5",
                    )}
                >
                    {Array.from({ length: 18 }).map((_, i) => {
                        const hour = i + 6;
                        const PM_AM = hour >= 12 ? "PM" : "AM";
                        const formatIndex =
                            hour > 12
                                ? hour % 12
                                : hour === 0 || hour === 12
                                  ? 12
                                  : hour;
                        return Array.from({ length: 2 }).map((_, part) => {
                            const minutes = part * timestamp;
                            const trueIndex = hour * 2 + part;

                            const diff = Math.abs(
                                minutes - currentTime.minutes,
                            );

                            const isSelected =
                                (currentTime.hours === hour ||
                                    currentTime.hours === formatIndex) &&
                                Time.split(" ")[1] === PM_AM &&
                                diff < 15;

                            const isSuggested = !value && isSelected;

                            const currentValue = `${formatIndex}:${
                                minutes === 0 ? "00" : minutes
                            } ${PM_AM}`;

                            return (
                                <li
                                    tabIndex={isSelected ? 0 : -1}
                                    id={`time-${trueIndex}`}
                                    key={`time-${trueIndex}`}
                                    aria-label="currentTime"
                                    className={cn(
                                        buttonVariants({
                                            variant: isSuggested
                                                ? "secondary"
                                                : isSelected
                                                  ? "default"
                                                  : "outline",
                                        }),
                                        "h-8 px-3 w-full text-sm focus-visible:outline-0 outline-0 focus-visible:border-0 cursor-default ring-0",
                                    )}
                                    onClick={() =>
                                        handleClick(
                                            hour,
                                            part,
                                            PM_AM,
                                            trueIndex,
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            handleClick(
                                                hour,
                                                part,
                                                PM_AM,
                                                trueIndex,
                                            );
                                        }
                                    }}
                                    onFocus={() =>
                                        isSuggested && setActiveIndex(trueIndex)
                                    }
                                >
                                    {currentValue}
                                </li>
                            );
                        });
                    })}
                </ul>
            </Scroller>
        </div>
    );
};

const NaturalLanguageInput = React.forwardRef<
    HTMLInputElement,
    {
        placeholder?: string;
        disabled?: boolean;
    }
>(({ placeholder, ...props }, ref) => {
    const { value, onValueChange, Time, onTimeChange, disabled } =
        useSmartDateInput();

    const _placeholder =
        placeholder ?? 'e.g. "tomorrow at 5pm" or "in 2 hours"';

    const [inputValue, setInputValue] = React.useState<string>("");

    React.useEffect(() => {
        const hour = new Date().getHours();
        const timeVal = `${
            hour >= 12 ? hour % 12 : hour
        }:${new Date().getMinutes()} ${hour >= 12 ? "PM" : "AM"}`;
        setInputValue(value ? formatDateTime(value) : "");
        onTimeChange(value ? Time : timeVal);
    }, [value, Time, onTimeChange]);

    const handleParse = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const parsedDateTime = parseDateTime(e.currentTarget.value);
            if (parsedDateTime) {
                if (
                    disabled &&
                    typeof disabled !== "boolean" &&
                    disabled(parsedDateTime)
                ) {
                    return;
                }
                const PM_AM = parsedDateTime.getHours() >= 12 ? "PM" : "AM";

                const PM_AM_hour = parsedDateTime.getHours();

                const hour =
                    PM_AM_hour > 12
                        ? PM_AM_hour % 12
                        : PM_AM_hour === 0 || PM_AM_hour === 12
                          ? 12
                          : PM_AM_hour;

                onValueChange(parsedDateTime);
                setInputValue(formatDateTime(parsedDateTime));
                onTimeChange(`${hour}:${parsedDateTime.getMinutes()} ${PM_AM}`);
            }
        },
        [disabled, onValueChange, onTimeChange],
    );

    const handleKeydown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            switch (e.key) {
                case "Enter": {
                    const parsedDateTime = parseDateTime(e.currentTarget.value);
                    if (parsedDateTime) {
                        if (
                            disabled &&
                            typeof disabled !== "boolean" &&
                            disabled(parsedDateTime)
                        ) {
                            return;
                        }
                        const PM_AM =
                            parsedDateTime.getHours() >= 12 ? "PM" : "AM";

                        const PM_AM_hour = parsedDateTime.getHours();

                        const hour =
                            PM_AM_hour > 12
                                ? PM_AM_hour % 12
                                : PM_AM_hour === 0 || PM_AM_hour === 12
                                  ? 12
                                  : PM_AM_hour;

                        onValueChange(parsedDateTime);
                        setInputValue(formatDateTime(parsedDateTime));
                        onTimeChange(
                            `${hour}:${parsedDateTime.getMinutes()} ${PM_AM}`,
                        );
                    }
                    break;
                }
            }
        },
        [disabled, onValueChange, onTimeChange],
    );

    return (
        <Input
            ref={ref}
            type="text"
            placeholder={_placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            onKeyDown={handleKeydown}
            onBlur={handleParse}
            className={cn(
                "px-2 mr-0.5 flex-1 border-none h-8 rounded",
                inputBase,
            )}
            {...props}
        />
    );
});

NaturalLanguageInput.displayName = "NaturalLanguageInput";

// Type for DateTimeLocalInputProps, using DayPickerSingleProps for Calendar
// This assumes your Calendar component underneath is compatible with react-day-picker's single mode props
interface DateTimeLocalInputProps
    extends Omit<
        DayPickerSingleProps,
        "mode" | "selected" | "onSelect" | "disabled"
    > {
    className?: string;
    disabled?: boolean | ((date: Date) => boolean);
    // className might be passed to the PopoverTrigger or Calendar, clarify if needed for specific targeting
    // For now, assuming className is for the root or a primary element if DayPickerSingleProps doesn't cover it.
}

const DateTimeLocalInput = ({
    className, // className from props can be used on the Button or Calendar as needed
    disabled,
    ...props // Spread remaining DayPickerSingleProps (like initialFocus, locale etc.) to Calendar
}: DateTimeLocalInputProps) => {
    const { value, onValueChange, Time } = useSmartDateInput();

    const formateSelectedDate = React.useCallback(
        (selectedDate: Date | undefined) => {
            if (!selectedDate) return;
            if (typeof disabled === "boolean" && disabled) return;
            if (typeof disabled === "function" && disabled(selectedDate))
                return;

            // Create a new Date object from selectedDate to avoid mutating the original DayPicker state
            const newSelectedDate = new Date(selectedDate.getTime());

            let hours = newSelectedDate.getHours(); // Default to selected date's hours
            let minutes = newSelectedDate.getMinutes(); // Default to selected date's minutes

            if (Time?.includes(":") && Time?.includes(" ")) {
                const timeParts = Time.split(":");
                const hourMinutePart = timeParts[0]; // e.g., "5"
                const minuteAndPeriodPart = timeParts[1]; // e.g., "00 PM"

                const parsedHourStr = hourMinutePart;
                const minuteStr = minuteAndPeriodPart.substring(0, 2); // "00"
                const period = minuteAndPeriodPart
                    .substring(3, 5)
                    .toUpperCase(); // "PM"

                let h = Number.parseInt(parsedHourStr);
                const m = Number.parseInt(minuteStr);

                if (!Number.isNaN(h) && !Number.isNaN(m)) {
                    if (period === "PM" && h < 12) {
                        h += 12;
                    }
                    if (period === "AM" && h === 12) {
                        // 12 AM is 00 hours
                        h = 0;
                    }
                    hours = h;
                    minutes = m;
                }
            }

            newSelectedDate.setHours(hours, minutes, 0, 0); // Set seconds and ms to 0 for consistency
            onValueChange(newSelectedDate);
        },
        [disabled, Time, onValueChange],
    );

    return (
        <Popover modal>
            <PopoverTrigger asChild>
                <Button
                    disabled={typeof disabled === "boolean" ? disabled : false}
                    variant={"outline"}
                    size={"icon"}
                    className={cn(
                        "size-9 flex items-center justify-center font-normal",
                        !value && "text-muted-foreground",
                    )}
                >
                    <CalendarIcon className="size-4" />
                    <span className="sr-only">calender</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" sideOffset={8}>
                <div className="flex gap-1">
                    <Calendar
                        disabled={disabled}
                        {...props}
                        id={"calendar"}
                        className={cn(
                            "peer flex justify-end", // Use passed className here for the Calendar itself if desired
                            inputBase,
                            className, // Or apply className to PopoverTrigger Button if more appropriate
                        )}
                        mode="single"
                        selected={value}
                        onSelect={formateSelectedDate}
                        initialFocus
                    />
                    <TimePicker />
                </div>
            </PopoverContent>
        </Popover>
    );
};

DateTimeLocalInput.displayName = "DateTimeLocalInput";
