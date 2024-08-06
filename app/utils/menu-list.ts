import {
    Tag,
    Users,
    Settings,
    Bookmark,
    SquarePen,
    Handshake,
    Braces,
    AreaChart,
    Cuboid,
    House,
    TextSearch,
    RadioTower,
    ArrowDownUp,
    MapPinned,
    Database,
    LayoutPanelLeftIcon,
    DoorOpen,
    DollarSign,
    Construction
  } from "lucide-react";
  import { BsStripe } from "react-icons/bs";

import {
    TbCloudDataConnection,
    TbDatabaseShare
} from "react-icons/tb";
import {
    SiOpenapiinitiative
} from "react-icons/si"
  
  type Submenu = {
    href: string;
    label: string;
    active: boolean;
  };
  
  type Menu = {
    href: string;
    label: string;
    active: boolean;
    icon: any;
    submenus: Submenu[];
  };
  
  type Group = {
    groupLabel: string;
    menus: Menu[];
  };
  
  export function getMenuList(pathname: string): Group[] {
    return [
      {
        groupLabel: "Management",
        menus: [
          {
            href: "/home",
            label: "Home",
            active: pathname.includes("/home"),
            icon: House,
            submenus: []
          },
          {
            href: "/apps",
            label: "Apps",
            active: pathname.includes("/apps"),
            icon: LayoutPanelLeftIcon,
            submenus: [
              {
                href: "/apps/add",
                label: "Add App",
                active: pathname.includes("/apps/add"),
              },
              {
                href: "/apps/",
                label: "Manage Apps",
                active: pathname.includes("/apps/"),
              },
            ]
          },
        ]
      },
      {
        groupLabel: "Settings",
        menus: [
          {
            href: "/users",
            label: "Users",
            active: pathname.includes("/users"),
            icon: Users,
            submenus: []
          },
          {
            href: "/billing",
            label: "Billing (Under Construction)",
            active: pathname.includes("/billing"),
            icon: Construction,
            submenus: []
          },
        ]
      },
    ];
  }