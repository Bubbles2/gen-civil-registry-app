/**
 * React 19 removed `defaultProps` on function components. The object is not
 * deprecated any more, it is ignored outright: a prop that used to default to
 * `true` now arrives as `undefined`, which is falsy. In this app that silently
 * hid or froze form fields (`display`, `visible`, `editable`).
 *
 * `withDefaults` restores the rule React used to apply, and only that rule: a
 * default fills in when the incoming value is `undefined`, and never when it is
 * `null`, `false`, `0` or `""`. Spreading (`{...defaults, ...props}`) is not
 * equivalent — it lets an explicitly passed `undefined` beat the default, which
 * `defaultProps` did not.
 *
 * Applying it inside the component keeps `props.x` working in every body, so
 * the Phase 14 migration did not have to destructure eight components.
 */
export function withDefaults<P extends object, D extends object>(
  props: P,
  defaults: D,
): P & D {
  const merged = {...props} as P & D;
  for (const key of Object.keys(defaults) as (keyof D)[]) {
    if ((merged as Record<string, unknown>)[key as string] === undefined) {
      (merged as Record<string, unknown>)[key as string] = defaults[key];
    }
  }
  return merged;
}
