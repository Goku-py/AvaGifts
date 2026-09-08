"use client";

import type { ComponentProps } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCatalog } from "@/components/catalog/catalog-context";

export type CatalogButtonProps = Omit<ButtonProps, "onClick"> & ComponentProps<"button">;

/**
 * "View Catalog" button wired to the catalog context.
 * Carries `data-catalog-trigger` so the future flipbook viewer
 * (Lane 3) can locate/attach to triggers if needed.
 */
export function CatalogButton({
  children = "View Catalog",
  arrow = true,
  ...rest
}: CatalogButtonProps) {
  const { openCatalog } = useCatalog();

  return (
    <Button type="button" arrow={arrow} data-catalog-trigger onClick={openCatalog} {...rest}>
      {children}
    </Button>
  );
}
