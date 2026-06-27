"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  min: number;
  max: number;
  step?: number;
  value?: [number, number];
  defaultValue?: [number, number];
  label?: string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      min,
      max,
      step = 1,
      value: valueProp,
      defaultValue = [min, max],
      label,
      onValueChange: onValueChangeProp,
      ...props
    },
    ref
  ) => {
    const [internalValues, setInternalValues] = React.useState<[number, number]>(defaultValue);
    const isControlled = valueProp !== undefined;
    const values = isControlled ? valueProp : internalValues;

    const handleValueChange = (newValues: number[]) => {
      if (!isControlled) setInternalValues([newValues[0], newValues[1]]);
      onValueChangeProp?.(newValues);
    };

    return (
      <div className="w-full relative">
        <SliderPrimitive.Root
          ref={ref}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
          )}
          min={min}
          max={max}
          step={step}
          value={values}
          onValueChange={handleValueChange}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-brand/20">
            <SliderPrimitive.Range className="absolute h-full bg-brand" />
          </SliderPrimitive.Track>

          {/* Thumb 1 with Label */}
          <div
            className="absolute -translate-x-1/2 -bottom-8 text-xs font-medium px-2 py-1 rounded z-10 text-brand"
            style={{
              left: `${((values[0] - min) / (max - min)) * 100}%`,
            }}
          >
            {label}
            {values[0]}
          </div>
          <SliderPrimitive.Thumb className="relative block h-4 w-4 rounded-full border-2 border-brand bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 hover:border-brand/80" />

          {/* Thumb 2 with Label */}
          <div
            className="absolute -translate-x-1/2 -bottom-8 text-xs font-medium px-2 py-1 rounded z-10 text-brand"
            style={{
              left: `${((values[1] - min) / (max - min)) * 100}%`,
            }}
          >
            {label}
            {values[1]}
          </div>
          <SliderPrimitive.Thumb className="relative block h-4 w-4 rounded-full border-2 border-brand bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 hover:border-brand/80" />
        </SliderPrimitive.Root>
      </div>
    );
  }
);

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
