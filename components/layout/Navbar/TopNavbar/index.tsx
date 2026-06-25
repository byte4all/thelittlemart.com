import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import Link from "next/link";
import React from "react";
import { NavMenu } from "../navbar.types";
import { MenuList } from "./MenuList";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MenuItem } from "./MenuItem";
import Image from "next/image";
import InputGroup from "@/components/ui/input-group";
import ResTopNavbar from "./ResTopNavbar";
import CartBtn from "./CartBtn";
import UserMenu from "./UserMenu";

const data: NavMenu = [
  {
    id: 1,
    label: "Shop",
    type: "MenuList",
    children: [
      {
        id: 11,
        label: "Body Wash",
        url: "/shop?category=body-wash",
        description: "Gentle cleansers for soft, refreshed skin",
      },
      {
        id: 12,
        label: "Conditioner",
        url: "/shop?category=conditioner",
        description: "Nourish and detangle for smooth, manageable hair",
      },
      {
        id: 13,
        label: "Shampoo",
        url: "/shop?category=shampoo",
        description: "Clean, healthy hair for every hair type",
      },
      {
        id: 15,
        label: "Towels",
        url: "/shop?category=kiwi-towels",
        description: "Soft, absorbent towels for bath and beyond",
      },
      {
        id: 16,
        label: "Soap Bar",
        url: "/shop?category=soap-bar",
        description: "Classic bars for cleansing and care",
      },
      {
        id: 17,
        label: "Bags",
        url: "/shop?category=kiwi-bags",
        description: "Stylish and practical bags for everyday essentials",
      },
    ],
  },
  {
    id: 3,
    type: "MenuItem",
    label: "Best Sellers",
    url: "/shop?bestSellers=1",
    children: [],
  },
  {
    id: 4,
    type: "MenuItem",
    label: "Brands",
    url: "/shop?view=brands",
    children: [],
  },
];

const TopNavbar = () => {
  return (
    <nav className="sticky top-0 bg-white z-20">
      <div className="flex relative max-w-frame mx-auto items-center justify-between md:justify-start py-5 md:py-6 px-4 xl:px-0">
        <div className="flex items-center">
          <div className="block md:hidden mr-4">
            <ResTopNavbar data={data} />
          </div>
          <Link
            href="/"
            className={cn([
              integralCF.className,
              "text-2xl lg:text-[32px] mb-2 mr-3 lg:mr-10 bg-gradient-to-r from-brand to-brand-accent bg-clip-text text-transparent",
            ])}
          >
            AQUAHEAVEN
          </Link>
        </div>
        <NavigationMenu className="hidden md:flex mr-2 lg:mr-7">
          <NavigationMenuList>
            {data.map((item) => (
              <React.Fragment key={item.id}>
                {item.type === "MenuItem" && (
                  <MenuItem label={item.label} url={item.url} />
                )}
                {item.type === "MenuList" && (
                  <MenuList data={item.children} label={item.label} />
                )}
              </React.Fragment>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <InputGroup className="hidden md:flex bg-[#F0F0F0] mr-3 lg:mr-10">
          <InputGroup.Text>
            <Image
              priority
              src="/icons/search.svg"
              height={20}
              width={20}
              alt="search"
              className="min-w-5 min-h-5"
            />
          </InputGroup.Text>
          <InputGroup.Input
            type="search"
            name="search"
            placeholder="Search for products..."
            className="bg-transparent placeholder:text-black/40"
          />
        </InputGroup>
        <div className="flex items-center">
          <Link href="/search" className="block md:hidden mr-[14px] p-1">
            <Image
              priority
              src="/icons/search-black.svg"
              height={100}
              width={100}
              alt="search"
              className="max-w-[22px] max-h-[22px]"
            />
          </Link>
          <CartBtn />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
