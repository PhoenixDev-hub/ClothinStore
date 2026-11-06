import { describe, expect, it } from "vitest";
import { formatBRL, parseBRLToCents } from "./money";

const plain = (value: string) => value.replace(/\u00A0/g, " ");

describe("formatBRL", () => {
  it("formats integer cents as BRL", () => {
    expect(plain(formatBRL(5990))).toBe("R$ 59,90");
  });

  it("formats zero and thousands", () => {
    expect(plain(formatBRL(0))).toBe("R$ 0,00");
    expect(plain(formatBRL(123456))).toBe("R$ 1.234,56");
  });
});

describe("parseBRLToCents", () => {
  it("parses comma decimals", () => {
    expect(parseBRLToCents("59,90")).toBe(5990);
  });

  it("parses thousands separators", () => {
    expect(parseBRLToCents("1.234,56")).toBe(123456);
  });

  it("accepts plain integers and dot decimals", () => {
    expect(parseBRLToCents("59")).toBe(5900);
    expect(parseBRLToCents("59.90")).toBe(5990);
  });

  it("treats dot groups of three as thousands", () => {
    expect(parseBRLToCents("1.234")).toBe(123400);
  });

  it("rejects empty, negative and non-numeric input", () => {
    expect(parseBRLToCents("")).toBeUndefined();
    expect(parseBRLToCents("-1")).toBeUndefined();
    expect(parseBRLToCents("abc")).toBeUndefined();
  });
});
