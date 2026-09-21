/**
 * Input shaping for `realm.create`, needed since Realm 12.
 *
 * Realm 11 filled a property's schema `default` whenever the value was missing
 * or `undefined`, including inside nested objects created through the parent.
 * Realm 12 throws "Missing value for property" in those cases (observed on the
 * MOTHER.INFO_DOM.FORWARDING_ADDRESS field that the form omits when the mother
 * shares the father's address). Two steps restore the Realm 11 outcome:
 *
 *  1. `stripUndefined` — drop keys whose value is `undefined`.
 *  2. `applySchemaDefaults` — for every non-optional property that declares a
 *     `default` in the Realm schema and is still absent, write that default,
 *     recursing into linked objects and lists of objects.
 *
 * Plain objects and arrays are walked; anything else (ObjectId, Date, …) is
 * passed through untouched. `null` is kept: it is a value, not an absence.
 */

export type PropertySpec = string | { type: string; objectType?: string; optional?: boolean; default?: unknown };
export type Schema = ReadonlyArray<{ name: string; properties: Record<string, PropertySpec> }>;

/** Normalise Realm's shorthand ("INFO_DOM_MOTHER", "TAG[]", "string?") to the object form. */
function normalise(spec: PropertySpec, schema: Schema) {
  if (typeof spec !== "string") {
    return spec;
  }
  let type = spec;
  let optional = false;
  if (type.endsWith("?")) {
    optional = true;
    type = type.slice(0, -1);
  }
  if (type.endsWith("[]")) {
    const inner = type.slice(0, -2);
    return schema.some(o => o.name === inner) ? { type: "list", objectType: inner, optional } : { type: "list", optional };
  }
  return schema.some(o => o.name === type) ? { type: "object", objectType: type, optional } : { type, optional };
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

export function applySchemaDefaults<T>(schema: Schema, objectType: string, value: T): T {
  if (!isPlainObject(value)) {
    return value;
  }
  const objectSchema = schema.find(s => s.name === objectType);
  if (!objectSchema) {
    return value;
  }
  const out: Record<string, unknown> = { ...value };
  for (const [name, spec] of Object.entries(objectSchema.properties)) {
    const prop = normalise(spec, schema);
    if (!(name in out)) {
      if (prop.default !== undefined && !prop.optional) {
        out[name] = typeof prop.default === "function" ? (prop.default as () => unknown)() : prop.default;
      }
      continue;
    }
    if (prop.type === "object" && prop.objectType) {
      out[name] = applySchemaDefaults(schema, prop.objectType, out[name]);
    } else if (prop.type === "list" && prop.objectType && Array.isArray(out[name])) {
      out[name] = (out[name] as unknown[]).map(item => applySchemaDefaults(schema, prop.objectType as string, item));
    }
  }
  return out as T;
}

/** What `addOrUpdateForm` feeds to `realm.create`. */
export function toRealmInput<T>(schema: Schema, objectType: string, value: T): T {
  return applySchemaDefaults(schema, objectType, stripUndefined(value));
}
