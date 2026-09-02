import type { VariableBundle } from '@domain/variable/VariableScope';

export const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][\w.-]*)\s*\}\}/g;

export interface ResolvedString {
  readonly value: string;
  readonly missing: ReadonlyArray<string>;
}

export interface VariableResolver {
  resolve(template: string, bundle: VariableBundle): ResolvedString;
  resolveAll(values: ReadonlyArray<readonly [string, string]>, bundle: VariableBundle): Map<string, ResolvedString>;
}

function lookup(bundle: VariableBundle, key: string): string | undefined {
  const inRuntime = bundle.runtime.find((v) => v.enabled && v.key === key);
  if (inRuntime) return inRuntime.value;
  const inRequest = bundle.request.find((v) => v.enabled && v.key === key);
  if (inRequest) return inRequest.value;
  const inCollection = bundle.collection.find((v) => v.enabled && v.key === key);
  if (inCollection) return inCollection.value;
  return undefined;
}

export class DefaultVariableResolver implements VariableResolver {
  resolve(template: string, bundle: VariableBundle): ResolvedString {
    if (!template) return { value: '', missing: [] };
    const missing = new Set<string>();
    const value = template.replace(VARIABLE_PATTERN, (_match, key: string) => {
      const found = lookup(bundle, key);
      if (found === undefined) {
        missing.add(key);
        return '';
      }
      return found;
    });
    return { value, missing: Array.from(missing) };
  }

  resolveAll(
    values: ReadonlyArray<readonly [string, string]>,
    bundle: VariableBundle,
  ): Map<string, ResolvedString> {
    const out = new Map<string, ResolvedString>();
    for (const [name, template] of values) {
      out.set(name, this.resolve(template, bundle));
    }
    return out;
  }
}

export const variableResolver: VariableResolver = new DefaultVariableResolver();