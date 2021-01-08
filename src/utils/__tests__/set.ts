import set from "../set";

describe("set", () => {
  it("should throw error when input is invalid", () => {
    expect(() => set(null, "foo", "🍎")).toThrow(TypeError);
    expect(() => set(undefined, "foo", "🍎")).toThrow(TypeError);
    expect(() => set(true, "foo", "🍎")).toThrow(TypeError);
    expect(() => set("", "foo", "🍎")).toThrow(TypeError);
    expect(() => set(1, "foo", "🍎")).toThrow(TypeError);
    expect(() => set([], "foo", "🍎")).toThrow(TypeError);
    expect(() => set(() => null, "foo", "🍎")).toThrow(TypeError);
  });
});
