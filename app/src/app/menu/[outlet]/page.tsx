import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuClient from "./MenuClient";

export const dynamic = "force-dynamic"; // menu changes via admin, don't statically cache

export default async function OutletMenuPage({
  params,
}: {
  params: { outlet: string };
}) {
  const outlet = await prisma.outlet.findUnique({
    where: { slug: params.outlet },
    include: {
      property: true,
      sections: {
        orderBy: { displayOrder: "asc" },
        include: {
          categories: {
            orderBy: { displayOrder: "asc" },
            include: {
              items: {
                where: { active: true },
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!outlet) notFound();

  // Prisma's Decimal type isn't serializable across the server/client boundary - convert to number.
  const serialized = {
    ...outlet,
    sections: outlet.sections.map((section) => ({
      ...section,
      categories: section.categories.map((category) => ({
        ...category,
        items: category.items.map((item) => ({
          ...item,
          price: Number(item.price),
        })),
      })),
    })),
  };

  return <MenuClient outlet={serialized} />;
}
