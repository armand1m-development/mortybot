// deno-lint-ignore-file ban-unused-ignore
export function replacer(_key: string, value: unknown) {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: [...value],
    };
  } else {
    return value;
  }
}

interface MapDataType<T> {
  dataType: "Map";
  value: [string, T][];
}

// deno-lint-ignore ban-types
function isMap(value: object): value is MapDataType<unknown> {
  return "dataType" in value && value.dataType === "Map";
}

export function reviver(_key: string, value: unknown) {
  if (typeof value === "object" && value !== null) {
    if (isMap(value)) {
      return new Map(value.value);
    }
  }
  return value;
}
