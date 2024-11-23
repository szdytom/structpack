import { BaseTypeHandler, CompoundTypeHandler } from './type-handler.mjs';

export { BASIC_TYPES, BaseTypeHandler, DeserializedResult } from './type-handler.mjs';

/**
 * Serializes JavaScript value to binary.
 * @param {any} value - value to serialize.
 * @param {BaseTypeHandler} type - type handler of the value.
 * @returns {ArrayBuffer} - the serialized binary buffer.
 */
export function serializeToBinary(value, type) {
	if (!(type instanceof BaseTypeHandler)) {
		type = new CompoundTypeHandler(type);
	}

	const res = new ArrayBuffer(type.sizeof(value));
	const view = new DataView(res);
	type.serialize(view, 0, value);
	return res;
}

/**
 * Deserializes binary back to JavaScript value.
 * @param {DataView | ArrayBuffer | ArrayBufferLike} viewOrBuffer - buffer or dataView to deserialize.
 * @param {BaseTypeHandler} type - type handler of the desired value.
 * @returns {any} - the deserialized JavaScript value.
 */
export function deserializeFromBinary(viewOrBuffer, type) {
	if (!(viewOrBuffer instanceof DataView)) { // Check if not a DataView instance already
		if (ArrayBuffer.isView(viewOrBuffer)) viewOrBuffer = viewOrBuffer.buffer // If its not ArrayBuffer, take the ArrayBuffer inside it
		viewOrBuffer = new DataView(viewOrBuffer) // Initialize a DataView
	}
	if (!(type instanceof BaseTypeHandler)) {
		type = new CompoundTypeHandler(type);
	}

	const tmp = type.deserialize(view, 0);
	return tmp.value;
}
