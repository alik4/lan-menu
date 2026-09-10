# QR Menu App - Step 1: skeleton, schema, public menu route

## What's in this step

- Docker Compose with two services: `app` (Next.js) and `db` (Postgres).
- Prisma schema: Property -> Outlet -> Section -> Category -> Item, plus Admin.
- Seed script pre-loaded with your real 3 properties and 8 outlets, plus one
  demo item on Dweik so you can confirm the whole pipeline renders.
- A working public menu page at `/menu/[outlet-slug]` with section tabs
  (food/beverage/shisha) and category sub-tabs including "View all".

Not built yet (next steps): admin login, admin dashboard (add/edit/remove
items, categories, images), image upload handling.

## Run it

1. Copy the env file and fill in real secrets:

   ```
   cp .env.example .env
   ```

2. Build and start:

   ```
   docker compose up --build
   ```

3. Run migrations and seed data (first time only, in a second terminal):

   ```
   docker compose exec app npx prisma migrate dev --name init
   docker compose exec app npm run prisma:seed
   ```

4. Visit `http://localhost:3000/menu/dweik` - you should see the Dweik menu
   with a Food tab, a Main Course sub-tab, and one seeded item.

Try the other outlet slugs too: `room-service-hotel`, `znood-el-sett`,
`room-service-suite`, `fumebar`, `prime-18`, `lancs`, `room-service-plaza`.
They'll load with empty sections since only Dweik has demo data.

## Why upsert with hardcoded IDs in the seed

The demo section/category/item use fixed IDs (`demo-food-dweik`, etc.) so
re-running the seed doesn't create duplicates. Once the admin panel exists in
a later step, you won't touch this seed file again for real data.

## Next steps (in order)

1. Confirm this renders correctly and the data model matches what you need
   (tell me now if any outlet needs a section type outside food/beverage/shisha).
2. Admin login page + JWT auth middleware.
3. Admin dashboard: CRUD for sections, categories, and items, including image
   upload to the `uploads` volume.
4. Visual design pass on the guest-facing menu page once you've decided
   whether each outlet needs its own branding or one shared look.
