import { Buffer } from 'node:buffer';
import { DeserializedResult, isBaseTypeHandler, type BaseTypeHandler, type TypeLike, type TypeWithTypedef } from './contracts.js';

export function getHandlerObject(type: TypeLike): BaseTypeHandler {
	if (isBaseTypeHandler(type)) {
		return type;
	}
	return new CompoundTypeHandler(type);
}

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

export class FixedArrayHandler implements BaseTypeHandler<unknown[]> {
	n: number;
	element_handler: BaseTypeHandler;

	constructor(n: number, element_handler: TypeLike) {
		if (!Number.isSafeInteger(n) || n < 0) {
			throw new RangeError(`FixedArray length must be a non-negative safe integer, got ${n}.`);
		}
		this.n = n;
		this.element_handler = getHandlerObject(element_handler);
	}

	sizeof(value: unknown[]): number {
		if (!Array.isArray(value)) {
			throw new TypeError(`FixedArray expects an Array value, got ${typeof value}.`);
		}
		if (value.length !== this.n) {
			throw new RangeError(`FixedArray expects exactly ${this.n} elements, got ${value.length}.`);
		}
		let res = 0;
		for (let i = 0; i < this.n; i += 1) {
			res += this.element_handler.sizeof(value[i]);
		}
		return res;
	}

	serialize(view: DataView, offset: number, value: unknown[]): number {
		assertSafeOffset(view, offset);
		if (!Array.isArray(value)) {
			throw new TypeError(`FixedArray expects an Array value, got ${typeof value}.`);
		}
		if (value.length !== this.n) {
			throw new RangeError(`FixedArray expects exactly ${this.n} elements, got ${value.length}.`);
		}
		for (let i = 0; i < this.n; i += 1) {
			offset = this.element_handler.serialize(view, offset, value[i]);
		}
		return offset;
	}

	deserialize(view: DataView, offset: number): DeserializedResult<unknown[]> {
		assertSafeOffset(view, offset);
		const res: unknown[] = new Array(this.n);
		for (let i = 0; i < this.n; i += 1) {
			const tmp = this.element_handler.deserialize(view, offset);
			res[i] = tmp.value;
			offset = tmp.offset;
		}
		return new DeserializedResult(res, offset);
	}
}

export class RawBufferHandler implements BaseTypeHandler<Buffer | Uint8Array> {
	n: number;
	constructor(n: number) {
		if (!Number.isSafeInteger(n) || n < 0) {
			throw new RangeError(`Raw buffer length must be a non-negative safe integer, got ${n}.`);
		}
		this.n = n;
	}
	sizeof(value: Buffer | Uint8Array): number {
		if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
			throw new TypeError(`Raw buffer handler expects Buffer or Uint8Array, got ${typeof value}.`);
		}
		if (value.byteLength !== this.n) {
			throw new RangeError(`Raw buffer handler expects ${this.n} bytes, got ${value.byteLength}.`);
		}
		return this.n;
	}
	serialize(view: DataView, offset: number, value: Buffer | Uint8Array): number {
		assertSafeOffset(view, offset, this.n);
		if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
			throw new TypeError(`Raw buffer handler expects Buffer or Uint8Array, got ${typeof value}.`);
		}
		if (value.byteLength !== this.n) {
			throw new RangeError(`Raw buffer handler expects ${this.n} bytes, got ${value.byteLength}.`);
		}
		for (let i = 0; i < this.n; i += 1) {
			view.setUint8(offset + i, value[i]!);
		}
		return offset + this.n;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<Buffer> {
		assertSafeOffset(view, offset, this.n);
		return new DeserializedResult(Buffer.from(view.buffer, offset, this.n), offset + this.n);
	}
}

export class DynamicArrayHandler implements BaseTypeHandler<unknown[]> {
	element_handler: BaseTypeHandler;
	constructor(element_handler: TypeLike) {
		this.element_handler = getHandlerObject(element_handler);
	}
	sizeof(value: unknown[]): number {
		if (!Array.isArray(value)) {
			throw new TypeError(`DynamicArray expects an Array value, got ${typeof value}.`);
		}
		let size = 4;
		for (const element of value) {
			size += this.element_handler.sizeof(element);
		}
		return size;
	}
	serialize(view: DataView, offset: number, value: unknown[]): number {
		assertSafeOffset(view, offset, 4);
		if (!Array.isArray(value)) {
			throw new TypeError(`DynamicArray expects an Array value, got ${typeof value}.`);
		}
		view.setUint32(offset, value.length, true);
		offset += 4;
		for (const element of value) {
			offset = this.element_handler.serialize(view, offset, element);
		}
		return offset;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<unknown[]> {
		assertSafeOffset(view, offset, 4);
		const length = view.getUint32(offset, true);
		offset += 4;
		const res: unknown[] = new Array(length);
		for (let i = 0; i < length; i += 1) {
			const tmp = this.element_handler.deserialize(view, offset);
			res[i] = tmp.value;
			offset = tmp.offset;
		}
		return new DeserializedResult(res, offset);
	}
}

export class MapHandler implements BaseTypeHandler<Map<unknown, unknown>> {
	key_handler: BaseTypeHandler;
	value_handler: BaseTypeHandler;
	constructor(key_handler: TypeLike, value_handler: TypeLike) {
		this.key_handler = getHandlerObject(key_handler);
		this.value_handler = getHandlerObject(value_handler);
	}
	sizeof(value: Map<unknown, unknown>): number {
		if (!(value instanceof Map)) {
			throw new TypeError(`Map handler expects a Map value, got ${typeof value}.`);
		}
		let res = 4;
		for (const [k, v] of value) {
			res += this.key_handler.sizeof(k);
			res += this.value_handler.sizeof(v);
		}
		return res;
	}
	serialize(view: DataView, offset: number, value: Map<unknown, unknown>): number {
		assertSafeOffset(view, offset, 4);
		if (!(value instanceof Map)) {
			throw new TypeError(`Map handler expects a Map value, got ${typeof value}.`);
		}
		view.setUint32(offset, value.size, true);
		offset += 4;
		for (const [k, v] of value) {
			offset = this.key_handler.serialize(view, offset, k);
			offset = this.value_handler.serialize(view, offset, v);
		}
		return offset;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<Map<unknown, unknown>> {
		assertSafeOffset(view, offset, 4);
		const size = view.getUint32(offset, true);
		offset += 4;
		const res = new Map<unknown, unknown>();
		for (let i = 0; i < size; i += 1) {
			const resk = this.key_handler.deserialize(view, offset);
			const resv = this.value_handler.deserialize(view, resk.offset);
			offset = resv.offset;
			res.set(resk.value, resv.value);
		}
		return new DeserializedResult(res, offset);
	}
}

export class SetHandler implements BaseTypeHandler<Set<unknown>> {
	value_handler: BaseTypeHandler;
	constructor(value_handler: TypeLike) {
		this.value_handler = getHandlerObject(value_handler);
	}
	sizeof(value: Set<unknown>): number {
		if (!(value instanceof Set)) {
			throw new TypeError(`Set handler expects a Set value, got ${typeof value}.`);
		}
		let res = 4;
		for (const v of value) {
			res += this.value_handler.sizeof(v);
		}
		return res;
	}
	serialize(view: DataView, offset: number, value: Set<unknown>): number {
		assertSafeOffset(view, offset, 4);
		if (!(value instanceof Set)) {
			throw new TypeError(`Set handler expects a Set value, got ${typeof value}.`);
		}
		view.setUint32(offset, value.size, true);
		offset += 4;
		for (const v of value) {
			offset = this.value_handler.serialize(view, offset, v);
		}
		return offset;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<Set<unknown>> {
		assertSafeOffset(view, offset, 4);
		const size = view.getUint32(offset, true);
		offset += 4;
		const res = new Set<unknown>();
		for (let i = 0; i < size; i += 1) {
			const resv = this.value_handler.deserialize(view, offset);
			offset = resv.offset;
			res.add(resv.value);
		}
		return new DeserializedResult(res, offset);
	}
}

export class CompoundTypeHandler implements BaseTypeHandler<Record<string, unknown>> {
	type: TypeWithTypedef;
	typedef: readonly { field: string; type: TypeLike }[];
	fieldHandlers: readonly BaseTypeHandler[];

	constructor(type: TypeWithTypedef) {
		this.type = type;
		this.typedef = type.typedef ?? [];
		this.fieldHandlers = this.typedef.map((def) => getHandlerObject(def.type));
	}

	sizeof(value: Record<string, unknown>): number {
		if (!value || typeof value !== 'object') {
			throw new TypeError(`Compound type "${this.type.name}" expects an object value.`);
		}
		let res = 0;
		for (let i = 0; i < this.typedef.length; i += 1) {
			const def = this.typedef[i]!;
			const fieldHandler = this.fieldHandlers[i]!;
			res += fieldHandler.sizeof(value[def.field]);
		}
		return res;
	}

	serialize(view: DataView, offset: number, value: Record<string, unknown>): number {
		assertSafeOffset(view, offset);
		if (!value || typeof value !== 'object') {
			throw new TypeError(`Compound type "${this.type.name}" expects an object value.`);
		}
		for (let i = 0; i < this.typedef.length; i += 1) {
			const def = this.typedef[i]!;
			const fieldHandler = this.fieldHandlers[i]!;
			offset = fieldHandler.serialize(view, offset, value[def.field]);
		}
		return offset;
	}

	deserialize(view: DataView, offset: number): DeserializedResult<Record<string, unknown>> {
		assertSafeOffset(view, offset);
		const res = new this.type() as Record<string, unknown>;
		for (let i = 0; i < this.typedef.length; i += 1) {
			const def = this.typedef[i]!;
			const fieldHandler = this.fieldHandlers[i]!;
			const tmp = fieldHandler.deserialize(view, offset);
			res[def.field] = tmp.value;
			offset = tmp.offset;
		}
		return new DeserializedResult(res, offset);
	}
}
