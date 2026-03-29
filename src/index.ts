import { CompoundTypeHandler } from './type-handler.js';
import { isBaseTypeHandler, type BaseTypeHandler, type TypeLike, type TypeWithTypedef } from './type-handlers/contracts.js';

export { BASIC_TYPES, DeserializedResult, CompoundTypeHandler, ArrayBufferHandler } from './type-handler.js';
export type { BaseTypeHandler } from './type-handler.js';

/**
 * Serializes JavaScript value to binary.
 * @param {unknown} value - value to serialize.
 * @param {BaseTypeHandler} type - type handler of the value.
 * @returns {ArrayBuffer} - the serialized binary buffer.
 */
export function serializeToBinary<T>(value: T, type: BaseTypeHandler<T>): ArrayBuffer;
export function serializeToBinary<T extends object>(value: T, type: TypeWithTypedef<T>): ArrayBuffer;
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
 * @returns {unknown} - the deserialized JavaScript value.
 */
export function deserializeFromBinary<T>(
	viewOrBuffer: DataView | ArrayBuffer | ArrayBufferLike | ArrayBufferView,
	type: BaseTypeHandler<T>,
): T;
export function deserializeFromBinary<T extends object>(
	viewOrBuffer: DataView | ArrayBuffer | ArrayBufferLike | ArrayBufferView,
	type: TypeWithTypedef<T>,
): T;
export function deserializeFromBinary(
	viewOrBuffer: DataView | ArrayBuffer | ArrayBufferLike | ArrayBufferView,
	type: TypeLike,
): unknown {
	const view = viewOrBuffer instanceof DataView
		? viewOrBuffer
		: ArrayBuffer.isView(viewOrBuffer)
			? new DataView(viewOrBuffer.buffer, viewOrBuffer.byteOffset, viewOrBuffer.byteLength)
			: new DataView(viewOrBuffer);
	const handler = isBaseTypeHandler(type) ? type : new CompoundTypeHandler(type);
	const tmp = handler.deserialize(view, 0);
	return tmp.value;
}
