// Validation schema for buyer self-registration (email + password).
//
// Lives in src/lib (not the route file) so it can be unit-tested directly.
// Next.js route files may only export HTTP-method handlers + a small set of
// config consts; a stray named export there fails the generated route-type
// validator (.next/types) under `tsc --noEmit`, so we co-locate it here.

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
