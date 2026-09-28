import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Sizes are mobile-first: `default` (40px) and `lg` (44px) clear a
 * comfortable touch target on their own, and the visually compact sizes
 * (`sm`, `xs`, the icon variants) are expected to be paired with the
 * `tap-target` utility when they sit in a touch-reachable row, which
 * expands the hit area without changing how large the control looks.
 *
 * Every button is a pill — the fitness-app look — and the primary one is a
 * solid lime with near-black text, the single loudest thing on screen.
 *
 * `destructive` is a solid red because a destructive action should never be
 * the quietest thing on screen; `destructive-subtle` exists for the lower
 * emphasis "remove this row" case, where the solid treatment would shout.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,translate] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary font-semibold text-primary-foreground hover:bg-primary-strong focus-visible:border-primary",
        outline:
          "border-border-strong bg-card text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        subtle:
          "bg-primary-subtle text-primary-subtle-foreground hover:bg-[color-mix(in_oklch,var(--primary-subtle),var(--primary)_8%)]",
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-[color-mix(in_oklch,var(--destructive),black_10%)] focus-visible:ring-destructive/30",
        "destructive-subtle":
          "bg-destructive-subtle text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive-subtle),var(--destructive)_10%)] focus-visible:ring-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "tap-target h-8 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "tap-target h-9 gap-1.5 px-3 text-[0.8125rem]",
        lg: "h-11 px-5",
        xl: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-xs": "tap-target size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "tap-target size-9",
        "icon-lg": "size-11",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  block,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
