import { CompoundTypeHandler } from './type-handler.js';
import { isBaseTypeHandler, type TypeLike } from './type-handlers/contracts.js';

export { BASIC_TYPES, DeserializedResult, CompoundTypeHandler } from './type-handler.js';
export type { BaseTypeHandler } from './type-handler.js';

/**
 * Serializes JavaScript value to binary.
 * @param {any} value - value to serialize.
 * @param {BaseTypeHandler} type - type handler of the value.
 * @returns {ArrayBuffer} - the serialized binary buffer.
 */
export function serializeToBinary(value: unknown, type: TypeLike): ArrayBuffer {
	const handler = isBaseTypeHandler(type) ? type : new CompoundTypeHandler(type);
	const res = new ArrayBuffer(handler.sizeof(value));
	const view = new DataView(res);
	handler.serialize(view, 0, value);
	return res;
}

/**
 * Deserializes binary back to JavaScript value.
 * @param {DataView | ArrayBuffer | ArrayBufferLike} viewOrBuffer - buffer or dataView to deserialize.
 * @param {BaseTypeHandler} type - type handler of the desired value.
 * @returns {any} - the deserialized JavaScript value.
 */
export function deserializeFromBinary(viewOrBuffer: DataView | ArrayBuffer | ArrayBufferLike | ArrayBufferView, type: TypeLike): unknown {
	const view = viewOrBuffer instanceof DataView
		? viewOrBuffer
		: ArrayBuffer.isView(viewOrBuffer)
			? new DataView(viewOrBuffer.buffer, viewOrBuffer.byteOffset, viewOrBuffer.byteLength)
			: new DataView(viewOrBuffer);
	const handler = isBaseTypeHandler(type) ? type : new CompoundTypeHandler(type);
	const tmp = handler.deserialize(view, 0);
	return tmp.value;
}
