import { DeserializedResult, type BaseTypeHandler } from './contracts.js';

function assertSafeOffset(view: DataView, offset: number, bytes = 0): void {
	if (!Number.isSafeInteger(offset) || offset < 0) {
		throw new RangeError(`Invalid offset ${offset}. Offset must be a non-negative safe integer.`);
	}
	if (!Number.isSafeInteger(bytes) || bytes < 0) {
		throw new RangeError(`Invalid byte length ${bytes}. Byte length must be a non-negative safe integer.`);
	}
	if (offset + bytes > view.byteLength) {
		throw new RangeError(`Out-of-bounds read/write at offset ${offset} for ${bytes} bytes (view length: ${view.byteLength}).`);
	}
}

export class ArrayBufferHandler implements BaseTypeHandler<ArrayBuffer> {
	sizeof(value: ArrayBuffer): number {
		return value.byteLength + 4;
	}

	serialize(view: DataView, offset: number, value: ArrayBuffer): number {
		assertSafeOffset(view, offset, 4 + value.byteLength);
		view.setUint32(offset, value.byteLength, true);
		offset += 4;
		const bytes = new Uint8Array(value);
		for (let i = 0; i < bytes.length; i += 1) {
			view.setUint8(offset + i, bytes[i]!);
		}
		return offset + bytes.length;
	}

	deserialize(view: DataView, offset: number): DeserializedResult<ArrayBuffer> {
		assertSafeOffset(view, offset, 4);
		const length = view.getUint32(offset, true);
		offset += 4;
		assertSafeOffset(view, offset, length);
		const buffer = new Uint8Array(view.buffer, offset, length).slice().buffer;
		return new DeserializedResult(buffer, offset + length);
	}
}

export class Int8Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number {
		return 1;
	}
	serialize(view: DataView, offset: number, value: number): number {
		assertSafeOffset(view, offset, 1);
		view.setInt8(offset, value);
		return offset + 1;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		assertSafeOffset(view, offset, 1);
		return new DeserializedResult(view.getInt8(offset), offset + 1);
	}
}

export class Int16Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 2; }
	serialize(view: DataView, offset: number, value: number): number {
		assertSafeOffset(view, offset, 2);
		view.setInt16(offset, value, true);
		return offset + 2;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		assertSafeOffset(view, offset, 2);
		return new DeserializedResult(view.getInt16(offset, true), offset + 2);
	}
}

export class Int32Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 4; }
	serialize(view: DataView, offset: number, value: number): number {
		assertSafeOffset(view, offset, 4);
		view.setInt32(offset, value, true);
		return offset + 4;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		assertSafeOffset(view, offset, 4);
		return new DeserializedResult(view.getInt32(offset, true), offset + 4);
	}
}

export class Int64Handler implements BaseTypeHandler<bigint> {
	sizeof(_value: bigint): number { return 8; }
	serialize(view: DataView, offset: number, value: bigint): number {
		assertSafeOffset(view, offset, 8);
		view.setBigInt64(offset, value, true);
		return offset + 8;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<bigint> {
		assertSafeOffset(view, offset, 8);
		return new DeserializedResult(view.getBigInt64(offset, true), offset + 8);
	}
}

export class Uint8Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 1; }
	serialize(view: DataView, offset: number, value: number): number {
		assertSafeOffset(view, offset, 1);
		view.setUint8(offset, value);
		return offset + 1;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		assertSafeOffset(view, offset, 1);
		return new DeserializedResult(view.getUint8(offset), offset + 1);
	}
}

export class Uint16Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 2; }
	serialize(view: DataView, offset: number, value: number): number {
		assertSafeOffset(view, offset, 2);
		view.setUint16(offset, value, true);
		return offset + 2;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		assertSafeOffset(view, offset, 2);
		return new DeserializedResult(view.getUint16(offset, true), offset + 2);
	}
}

export class Uint32Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 4; }
	serialize(view: DataView, offset: number, value: number): number {
		assertSafeOffset(view, offset, 4);
		view.setUint32(offset, value, true);
		return offset + 4;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		assertSafeOffset(view, offset, 4);
		return new DeserializedResult(view.getUint32(offset, true), offset + 4);
	}
}

export class Uint64Handler implements BaseTypeHandler<bigint> {
	sizeof(_value: bigint): number { return 8; }
	serialize(view: DataView, offset: number, value: bigint): number {
		assertSafeOffset(view, offset, 8);
		view.setBigUint64(offset, value, true);
		return offset + 8;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<bigint> {
		assertSafeOffset(view, offset, 8);
		return new DeserializedResult(view.getBigUint64(offset, true), offset + 8);
	}
}

export class Float32Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 4; }
	serialize(view: DataView, offset: number, value: number): number {
		assertSafeOffset(view, offset, 4);
		view.setFloat32(offset, value);
		return offset + 4;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		assertSafeOffset(view, offset, 4);
		return new DeserializedResult(view.getFloat32(offset), offset + 4);
	}
}

export class Float64Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 8; }
	serialize(view: DataView, offset: number, value: number): number {
		assertSafeOffset(view, offset, 8);
		view.setFloat64(offset, value);
		return offset + 8;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		assertSafeOffset(view, offset, 8);
		return new DeserializedResult(view.getFloat64(offset), offset + 8);
	}
}

export class BoolHandler implements BaseTypeHandler<boolean> {
	sizeof(_value: boolean): number { return 1; }
	serialize(view: DataView, offset: number, value: boolean): number {
		assertSafeOffset(view, offset, 1);
		view.setUint8(offset, value ? 1 : 0);
		return offset + 1;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<boolean> {
		assertSafeOffset(view, offset, 1);
		return new DeserializedResult(view.getUint8(offset) !== 0, offset + 1);
	}
}

export class DateHandler implements BaseTypeHandler<Date> {
	sizeof(_value: Date): number { return 8; }
	serialize(view: DataView, offset: number, value: Date): number {
		assertSafeOffset(view, offset, 8);
		if (!(value instanceof Date)) {
			throw new TypeError(`Date handler expects a Date value, got ${typeof value}.`);
		}
		if (Number.isNaN(value.getTime())) {
			throw new TypeError('Date handler cannot serialize an invalid Date.');
		}
		view.setBigUint64(offset, BigInt(Math.floor(value.getTime() / 1000)), true);
		return offset + 8;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<Date> {
		assertSafeOffset(view, offset, 8);
		const timestamp = Number(view.getBigUint64(offset, true));
		return new DeserializedResult(new Date(timestamp * 1000), offset + 8);
	}
}

export class VoidHandler implements BaseTypeHandler<void> {
	sizeof(_value: void): number { return 0; }
	serialize(view: DataView, offset: number, _value: void): number {
		assertSafeOffset(view, offset);
		return offset;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<void> {
		assertSafeOffset(view, offset);
		return new DeserializedResult(undefined, offset);
	}
}

export class StringHandler implements BaseTypeHandler<string> {
	sizeof(value: string): number {
		if (typeof value !== 'string') {
			throw new TypeError(`String handler expects a string value, got ${typeof value}.`);
		}
		const encodedString = new TextEncoder().encode(value);
		return encodedString.byteLength + 4;
	}
	serialize(view: DataView, offset: number, value: string): number {
		if (typeof value !== 'string') {
			throw new TypeError(`String handler expects a string value, got ${typeof value}.`);
		}
		const encodedString = new TextEncoder().encode(value);
		assertSafeOffset(view, offset, 4 + encodedString.length);
		view.setUint32(offset, encodedString.length, true);
		offset += 4;
		for (let i = 0; i < encodedString.length; i += 1) {
			view.setUint8(offset + i, encodedString[i]!);
		}
		return offset + encodedString.length;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<string> {
		assertSafeOffset(view, offset, 4);
		const length = view.getUint32(offset, true);
		offset += 4;
		assertSafeOffset(view, offset, length);
		const decodedString = new TextDecoder().decode(new Uint8Array(view.buffer, offset, length));
		return new DeserializedResult(decodedString, offset + length);
	}
}
