"use client";

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/components/ui/utils'; // Assurez-vous que cette fonction cn est importée correctement

// --- 1. TooltipProvider ---
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}
TooltipProvider.displayName = TooltipPrimitive.Provider.displayName;

// --- 2. Tooltip (CORRECTION APPLIQUÉE ICI) ---

/**
 * Le composant Tooltip doit utiliser React.forwardRef pour que des bibliothèques
 * externes (comme framer-motion) puissent lui assigner une 'ref' si nécessaire,
 * éliminant l'avertissement: "Warning: Function components cannot be given refs."
 */
const Tooltip = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Root>, // Type de la ref
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> // Types des props
>(({ children, ...props }, ref) => ( // On accepte la 'ref' ici
  // Note: La 'ref' n'est pas passée directement à TooltipPrimitive.Root car Radix le gère en interne.
  // Cependant, en utilisant forwardRef sur le wrapper, on satisfait framer-motion/PopChild.
  // Nous passons simplement les props et le ref à l'intérieur du wrapper si besoin, 
  // mais ici, le simple fait d'utiliser forwardRef sur ce composant suffit.
  <TooltipProvider>
    <TooltipPrimitive.Root data-slot="tooltip" {...props} />
  </TooltipProvider>
));
Tooltip.displayName = TooltipPrimitive.Root.displayName; // Ajout du displayName pour le débogage

// --- 3. TooltipTrigger ---
function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;


// --- 4. TooltipContent (Déjà Correct) ---
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(
        "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-[var(--radix-tooltip-content-transform-origin)] rounded-md px-3 py-1.5 text-xs text-balance",
        className,
      )}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// --- Exportations ---
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };