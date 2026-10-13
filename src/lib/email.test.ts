import { describe, expect, it } from "vitest";
import { newPostEmail, parseSender } from "./email";

describe("parseSender", () => {
  it("splits a named sender", () => {
    expect(parseSender("Alejandro Sarmiento <hola@alejosarmiento.com>")).toEqual({
      name: "Alejandro Sarmiento",
      email: "hola@alejosarmiento.com",
    });
  });

  it("accepts a quoted name", () => {
    expect(parseSender('"Alejandro Sarmiento" <hola@alejosarmiento.com>')).toEqual({
      name: "Alejandro Sarmiento",
      email: "hola@alejosarmiento.com",
    });
  });

  it("accepts a bare address", () => {
    expect(parseSender(" hola@alejosarmiento.com ")).toEqual({ email: "hola@alejosarmiento.com" });
    expect(parseSender("<hola@alejosarmiento.com>")).toEqual({ email: "hola@alejosarmiento.com" });
  });

  it("rejects values without an address", () => {
    expect(parseSender("Alejandro Sarmiento")).toBeNull();
    expect(parseSender("")).toBeNull();
  });
});

describe("newPostEmail", () => {
  it("carries the unsubscribe tag Brevo replaces per recipient", () => {
    const email = newPostEmail({ title: "T", description: "D", url: "https://x.test/blog/t" });
    expect(email.html).toContain('href="{{ unsubscribe }}"');
  });
});
