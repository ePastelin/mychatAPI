import { test, describe, expect } from "@jest/globals";
import formatNumber from "../../helpers/formatNumber";

describe("format number function", () => {
  test("should throw an error if input is not a string or is wrong format", () => {
    expect(() => formatNumber(5219982933230)).toThrow(TypeError);
    expect(() => formatNumber(23424)).toThrow("Expected a string");
    expect(() => formatNumber('8129982933230')).toThrow(Error)
    expect(() => formatNumber('923')).toThrow("Wrong format")
  });
  test("Should return a number phone of 12 digits", () => {
    const phoneNumber = '5219982933230'
    const phoneNumberChanged= '529982933230'

    expect(formatNumber(phoneNumber)).toBe(phoneNumberChanged)
    expect(formatNumber(phoneNumber).length).toBe(12)
    expect(formatNumber(phoneNumber)).not.toBe(phoneNumber)
  }) 
});
