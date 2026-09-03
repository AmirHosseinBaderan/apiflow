export type SuggestKind =
  | 'keyword'
  | 'global'
  | 'context'
  | 'member'
  | 'property'
  | 'method'
  | 'variable'
  | 'snippet';

export interface JsSuggestion {
  label: string;
  kind: SuggestKind;
  detail: string;
  documentation?: string;
  insertText?: string;
}

export interface SuggestOptions {
  variables?: string[];
}

export interface CompletionContext {
  mode: 'member' | 'global';
  objectPath: string[];
  prefix: string;
  prefixStart: number;
}

function s(
  label: string,
  kind: SuggestKind,
  detail: string,
  insertText?: string,
  documentation?: string,
): JsSuggestion {
  return insertText
    ? { label, kind, detail, insertText, documentation }
    : { label, kind, detail, documentation };
}

const KEYWORDS: ReadonlyArray<JsSuggestion> = [
  s('break', 'keyword', 'Exit a loop'),
  s('case', 'keyword', 'Switch case'),
  s('catch', 'keyword', 'Catch error block'),
  s('class', 'keyword', 'Class declaration'),
  s('const', 'keyword', 'Block-scoped constant'),
  s('continue', 'keyword', 'Skip loop iteration'),
  s('debugger', 'keyword', 'Debugger statement'),
  s('default', 'keyword', 'Default branch'),
  s('delete', 'keyword', 'Delete a property'),
  s('do', 'keyword', 'Do-while loop'),
  s('else', 'keyword', 'Else branch'),
  s('export', 'keyword', 'Export symbol'),
  s('extends', 'keyword', 'Extend a class'),
  s('finally', 'keyword', 'Finally block'),
  s('for', 'keyword', 'For loop'),
  s('function', 'keyword', 'Function declaration'),
  s('if', 'keyword', 'Conditional'),
  s('import', 'keyword', 'Import module'),
  s('in', 'keyword', 'Check property in object'),
  s('instanceof', 'keyword', 'Instance check'),
  s('new', 'keyword', 'Construct an instance'),
  s('return', 'keyword', 'Return from a function'),
  s('super', 'keyword', 'Parent class reference'),
  s('switch', 'keyword', 'Switch statement'),
  s('this', 'keyword', 'Current context'),
  s('throw', 'keyword', 'Throw an error'),
  s('try', 'keyword', 'Try block'),
  s('typeof', 'keyword', 'Type of operand'),
  s('var', 'keyword', 'Function-scoped variable'),
  s('void', 'keyword', 'Void operator'),
  s('while', 'keyword', 'While loop'),
  s('with', 'keyword', 'With statement'),
  s('yield', 'keyword', 'Yield a value'),
  s('let', 'keyword', 'Block-scoped variable'),
  s('static', 'keyword', 'Static class member'),
  s('enum', 'keyword', 'Enum declaration'),
  s('await', 'keyword', 'Await a promise'),
  s('true', 'keyword', 'Boolean true'),
  s('false', 'keyword', 'Boolean false'),
  s('null', 'keyword', 'Null value'),
  s('undefined', 'keyword', 'Undefined value'),
];

const CONTEXT: ReadonlyArray<JsSuggestion> = [
  s(
    'pm',
    'context',
    'Script API (Postman-style)',
    undefined,
    'pm.variables.set(name, value), pm.variables.get(name), pm.variables.setCollection(name, value)',
  ),
  s(
    'response',
    'context',
    'Current HTTP response',
    undefined,
    'response.status (number), response.headers (object), response.body (object|text), response.bodyText (string)',
  ),
  s(
    'request',
    'context',
    'Current request (pre-request scripts)',
    undefined,
    'request.id, request.name, request.url, request.method',
  ),
  s(
    'variables',
    'context',
    'Variable bundles (pre-request scripts)',
    undefined,
    'variables.runtime, variables.request, variables.collection (arrays of { key, value })',
  ),
];

const BUILTINS: ReadonlyArray<JsSuggestion> = [
  s('Object', 'global', 'Object utilities'),
  s('Function', 'global', 'Function utilities'),
  s('Boolean', 'global', 'Boolean type'),
  s('Symbol', 'global', 'Symbol type'),
  s('Number', 'global', 'Number utilities'),
  s('BigInt', 'global', 'BigInt type'),
  s('Math', 'global', 'Math utilities'),
  s('Date', 'global', 'Date constructor'),
  s('String', 'global', 'String utilities'),
  s('Array', 'global', 'Array utilities'),
  s('Promise', 'global', 'Promise type'),
  s('JSON', 'global', 'JSON parser'),
  s('Error', 'global', 'Error type'),
  s('Map', 'global', 'Map collection'),
  s('Set', 'global', 'Set collection'),
  s('Reflect', 'global', 'Reflection utilities'),
  s('Proxy', 'global', 'Proxy constructor'),
  s('WeakMap', 'global', 'WeakMap collection'),
  s('WeakSet', 'global', 'WeakSet collection'),
  s('console', 'global', 'Console output'),
  s('fetch', 'global', 'Fetch API'),
  s('setTimeout', 'global', 'Schedule a timeout'),
  s('clearTimeout', 'global', 'Clear a timeout'),
  s('setInterval', 'global', 'Schedule an interval'),
  s('clearInterval', 'global', 'Clear an interval'),
  s('parseInt', 'global', 'Parse an integer'),
  s('parseFloat', 'global', 'Parse a float'),
  s('isNaN', 'global', 'NaN check'),
  s('isFinite', 'global', 'Finite check'),
  s('encodeURI', 'global', 'Encode a URI'),
  s('encodeURIComponent', 'global', 'Encode a URI component'),
  s('decodeURI', 'global', 'Decode a URI'),
  s('decodeURIComponent', 'global', 'Decode a URI component'),
  s('eval', 'global', 'Evaluate a string'),
  s('NaN', 'global', 'Not a Number'),
  s('Infinity', 'global', 'Infinity'),
];

const BUILTIN_MEMBERS: Record<string, ReadonlyArray<JsSuggestion>> = {
  Object: [
    s('keys', 'method', '(obj) List own keys'),
    s('values', 'method', '(obj) List own values'),
    s('entries', 'method', '(obj) List own entries'),
    s('assign', 'method', '(target, ...src) Shallow merge'),
    s('hasOwn', 'method', '(obj, key) Has own property'),
  ],
  JSON: [
    s('parse', 'method', '(text) Parse JSON'),
    s('stringify', 'method', '(value) Stringify to JSON'),
  ],
  Math: [
    s('max', 'method', '(...vals) Largest value'),
    s('min', 'method', '(...vals) Smallest value'),
    s('random', 'method', '() Random float in [0,1)'),
    s('floor', 'method', '(n) Round down'),
    s('ceil', 'method', '(n) Round up'),
    s('round', 'method', '(n) Round to nearest'),
    s('abs', 'method', '(n) Absolute value'),
    s('pow', 'method', '(b, e) Power'),
    s('sqrt', 'method', '(n) Square root'),
    s('trunc', 'method', '(n) Truncate'),
  ],
  console: [
    s('log', 'method', '(...args) Log output'),
    s('warn', 'method', '(...args) Warning output'),
    s('error', 'method', '(...args) Error output'),
    s('info', 'method', '(...args) Info output'),
  ],
  String: [s('fromCharCode', 'method', '(...codes) Build a string')],
  Number: [s('isInteger', 'method', '(n) Integer check'), s('isNaN', 'method', '(n) NaN check')],
  Array: [s('isArray', 'method', '(v) Array check')],
  Date: [s('now', 'method', '() Now in ms')],
  Symbol: [s('iterator', 'property', 'Async/sync iterator')],
  RegExp: [s('test', 'method', '(s) Test for match'), s('exec', 'method', '(s) Exec a match')],
  Reflect: [
    s('get', 'method', '(obj, key) Get property'),
    s('set', 'method', '(obj, key, val) Set property'),
    s('ownKeys', 'method', '(obj) Own keys'),
  ],
  Promise: [s('all', 'method', '(iter) All resolve'), s('race', 'method', '(iter) Race'), s('resolve', 'method', '(val) Resolve'), s('reject', 'method', '(err) Reject')],
  WeakMap: [s('length', 'property', 'WeakMap length')],
  Map: [s('set', 'method', '(k,v) Set entry'), s('get', 'method', '(k) Get entry'), s('has', 'method', '(k) Has entry')],
  Set: [s('add', 'method', '(v) Add entry'), s('has', 'method', '(v) Has entry')],
};

const SCOPE_MEMBERS: Record<string, ReadonlyArray<JsSuggestion>> = {
  pm: [s('variables', 'member', 'Variable scope API', undefined, 'pm.variables.set/get/setCollection')],
  'pm.variables': [
    s(
      'set',
      'method',
      "(name, value) Set runtime + collection variable",
      'pm.variables.set',
    ),
    s('setCollection', 'method', '(name, value) Persist collection variable', 'pm.variables.setCollection'),
    s('get', 'method', '(name) Read a variable value', 'pm.variables.get'),
  ],
  response: [
    s('status', 'property', 'HTTP status code (number)', 'response.status'),
    s('headers', 'property', 'Response headers (object)', 'response.headers'),
    s('body', 'property', 'Parsed response body (object|array|text)', 'response.body'),
    s('bodyText', 'property', 'Raw response body text (string)', 'response.bodyText'),
  ],
  request: [
    s('id', 'property', 'Request id'),
    s('name', 'property', 'Request name'),
    s('url', 'property', 'Request URL'),
    s('method', 'property', 'HTTP method'),
  ],
  variables: [
    s('runtime', 'property', 'Runtime variables (array of {key,value})'),
    s('request', 'property', 'Request variables (array of {key,value})'),
    s('collection', 'property', 'Collection variables (array of {key,value})'),
  ],
};

const SNIPPETS: ReadonlyArray<JsSuggestion> = [
  s(
    'return response.status === 200',
    'snippet',
    'Assert a 200 status',
    'return response.status === 200',
    'Test scripts pass when the script returns true.',
  ),
  s(
    'return response.body != null',
    'snippet',
    'Assert a non-empty body',
    'return response.body != null',
  ),
  s(
    'pm.variables.set("key", "value")',
    'snippet',
    'Set a variable',
    "pm.variables.set('key', 'value')",
  ),
  s(
    'pm.variables.get("key")',
    'snippet',
    'Read a variable',
    "pm.variables.get('key')",
  ),
  s(
    'JSON.parse(response.bodyText)',
    'snippet',
    'Parse response body as JSON',
    'return JSON.parse(response.bodyText)',
  ),
];

export function getCompletionContext(
  source: string,
  cursor: number,
): CompletionContext {
  const before = source.slice(0, cursor);

  const member = simpleMemberContext(before, cursor);
  if (member) return member;

  const globalMatch = before.match(/([A-Za-z_$][\w$]*)$/);
  const prefix = globalMatch ? globalMatch[1] : '';
  return {
    mode: 'global',
    objectPath: [],
    prefix,
    prefixStart: cursor - prefix.length,
  };
}

function simpleMemberContext(before: string, cursor: number): CompletionContext | null {
  // Detect: <ident.chain>.<prefix>  possibly with optional chaining ?.
  const re = /([A-Za-z_$][\w$]*(?:\??\.[\w$]+)*)\.([A-Za-z_$0-9]*)$/;
  const m = before.match(re);
  if (!m) return null;
  const chain = m[1]!;
  const prefix = m[2]!;
  const parts = chain.split(/\??\./).filter(Boolean);
  return {
    mode: 'member',
    objectPath: parts,
    prefix,
    prefixStart: cursor - prefix.length,
  };
}

function resolveMembers(path: string[]): ReadonlyArray<JsSuggestion> | undefined {
  const key = path.join('.');
  return SCOPE_MEMBERS[key] ?? BUILTIN_MEMBERS[key];
}

function filterByPrefix(list: ReadonlyArray<JsSuggestion>, prefix: string): JsSuggestion[] {
  const p = prefix.toLowerCase();
  if (!p) return [...list];
  return list.filter((s) => s.label.toLowerCase().startsWith(p));
}

export function getSuggestions(
  source: string,
  cursor: number,
  options?: SuggestOptions,
): JsSuggestion[] {
  const ctx = getCompletionContext(source, cursor);
  if (ctx.mode === 'member') {
    const members = resolveMembers(ctx.objectPath);
    if (!members) return [];
    return filterByPrefix(members, ctx.prefix);
  }
  const vars: JsSuggestion[] = (options?.variables ?? []).map((name) => ({
    label: name,
    kind: 'variable',
    detail: 'Available variable',
  }));
  const candidates: JsSuggestion[] = [...CONTEXT, ...BUILTINS, ...KEYWORDS, ...SNIPPETS, ...vars];
  return filterByPrefix(candidates, ctx.prefix);
}

export function applySuggestion(
  source: string,
  cursor: number,
  ctx: CompletionContext,
  suggestion: JsSuggestion,
): { source: string; cursor: number } {
  const text = suggestion.insertText ?? suggestion.label;
  const before = source.slice(0, ctx.prefixStart);
  const after = source.slice(cursor);
  const next = before + text + after;
  return { source: next, cursor: before.length + text.length };
}
