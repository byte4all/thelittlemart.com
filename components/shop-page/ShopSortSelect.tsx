"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ShopSortSelectProps = {
  hasCategory: boolean;
};

function resolveSortValue(sortBy?: string | null, order?: string | null, hasCategory?: boolean) {
  if (sortBy === "price" && order === "asc") return "low-price";
  if (sortBy === "price" && order === "desc") return "high-price";
  if (sortBy === "createdAt") return "newest";
  return "featured";
}

export default function ShopSortSelect({ hasCategory }: ShopSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sortBy");
  const order = searchParams.get("order");
  const value = resolveSortValue(sortBy, order, hasCategory);

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (next === "featured") {
      params.delete("sortBy");
      params.delete("order");
    } else if (next === "newest") {
      params.set("sortBy", "createdAt");
      params.set("order", "desc");
    } else if (next === "low-price") {
      params.set("sortBy", "price");
      params.set("order", "asc");
    } else if (next === "high-price") {
      params.set("sortBy", "price");
      params.set("order", "desc");
    }

    const query = params.toString();
    router.push(query ? `/shop?${query}` : "/shop");
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="font-medium text-sm px-1.5 sm:text-base w-fit text-black bg-transparent shadow-none border-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="featured">
          Featured
        </SelectItem>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="low-price">Low Price</SelectItem>
        <SelectItem value="high-price">High Price</SelectItem>
      </SelectContent>
    </Select>
  );
}
