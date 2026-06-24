import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/auth-register-schema";

describe("registerSchema", () => {
  it("accepts a valid email + password (>= 8 chars)", () => {
    const out = registerSchema.safeParse({
      email: "buyer@example.com",
      password: "hunter2hunter2",
    });
    expect(out.success).toBe(true);
  });

  it("accepts the 8-character minimum-length boundary password", () => {
    const out = registerSchema.safeParse({
      email: "buyer@example.com",
      password: "12345678", // exactly 8
    });
    expect(out.success).toBe(true);
  });

  it("rejects a 7-character password (below the minimum)", () => {
    const out = registerSchema.safeParse({
      email: "buyer@example.com",
      password: "1234567", // 7 chars
    });
    expect(out.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const out = registerSchema.safeParse({
      email: "not-an-email",
      password: "longenoughpassword",
    });
    expect(out.success).toBe(false);
  });

  it("treats name as optional", () => {
    const withoutName = registerSchema.safeParse({
      email: "buyer@example.com",
      password: "longenoughpassword",
    });
    expect(withoutName.success).toBe(true);

    const withName = registerSchema.safeParse({
      name: "Asha",
      email: "buyer@example.com",
      password: "longenoughpassword",
    });
    expect(withName.success).toBe(true);
  });
});
