/* tslint:disable */
/* eslint-disable */
/**
* @returns {number}
*/
export function tile_size(): number;
/**
* @param {Uint32Array} source
* @param {Uint32Array} target
* @returns {Uint8Array}
*/
export function create_diff(source: Uint32Array, target: Uint32Array): Uint8Array;
/**
* @param {Uint32Array} source
* @param {Uint8Array} diff_stream
* @returns {Uint32Array}
*/
export function apply_diff(source: Uint32Array, diff_stream: Uint8Array): Uint32Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly create_diff: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly apply_diff: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly tile_size: () => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
