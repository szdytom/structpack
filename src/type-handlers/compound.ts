import { Buffer } from 'node:buffer';
import { DeserializedResult, isBaseTypeHandler, type BaseTypeHandler, type TypeLike, type TypeWithTypedef } from './contracts.js';

export function getHandlerObject(type: TypeLike): BaseTypeHandler {
	if (isBaseTypeHandler(type)) {
		return type;
	}
	return new CompoundTypeHandler(type);
}

export class FixedArrayHandler implements BaseTypeHandler<unknown[]> {
	n: number;
	element_handler: BaseTypeHandler;

	constructor(n: number, element_handler: TypeLike) {
		this.n = n;
		this.element_handler = getHandlerObject(element_handler);
	}

	sizeof(value: unknown[]): number {
		let res = 0;
		for (let i = 0; i < this.n; i += 1) {
			res += this.element_handler.sizeof(value[i]);
		}
		return res;
	}

	serialize(view: DataView, offset: number, value: unknown[]): number {
		for (let i = 0; i < this.n; i += 1) {
			offset = this.element_handler.serialize(view, offset, value[i]);
		}
		return offset;
	}

	deserialize(view: DataView, offset: number): DeserializedResult<unknown[]> {
		const res: unknown[] = new Array(this.n);
		for (let i = 0; i < this.n; i += 1) {
			const tmp = this.element_handler.deserialize(view, offset);
			res[i] = tmp.value;
			offset = tmp.offset;
		}
		return new DeserializedResult(res, offset);
	}
}

export class RawBufferHandler implements BaseTypeHandler<Buffer> {
	n: number;
	constructor(n: number) {
		this.n = n;
	}
	sizeof(value: Buffer): number { return value.byteLength; }
	serialize(view: DataView, offset: number, value: Buffer): number {
		for (let i = 0; i < this.n; i += 1) {
			view.setUint8(offset + i, value.readUInt8(i));
		}
		return offset + this.n;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<Buffer> {
		return new DeserializedResult(Buffer.from(view.buffer, offset, this.n), offset + this.n);
	}
}

export class DynamicArrayHandler implements BaseTypeHandler<unknown[]> {
	element_handler: BaseTypeHandler;
	constructor(element_handler: TypeLike) {
		this.element_handler = getHandlerObject(element_handler);
	}
	sizeof(value: unknown[]): number {
		let size = 4;
		for (const element of value) {
			size += this.element_handler.sizeof(element);
		}
		return size;
	}
	serialize(view: DataView, offset: number, value: unknown[]): number {
		view.setUint32(offset, value.length, true);
		offset += 4;
		for (const element of value) {
			offset = this.element_handler.serialize(view, offset, element);
		}
		return offset;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<unknown[]> {
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
		let res = 4;
		for (const [k, v] of value) {
			res += this.key_handler.sizeof(k);
			res += this.value_handler.sizeof(v);
		}
		return res;
	}
	serialize(view: DataView, offset: number, value: Map<unknown, unknown>): number {
		view.setUint32(offset, value.size, true);
		offset += 4;
		for (const [k, v] of value) {
			offset = this.key_handler.serialize(view, offset, k);
			offset = this.value_handler.serialize(view, offset, v);
		}
		return offset;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<Map<unknown, unknown>> {
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
		let res = 4;
		for (const v of value) {
			res += this.value_handler.sizeof(v);
		}
		return res;
	}
	serialize(view: DataView, offset: number, value: Set<unknown>): number {
		view.setUint32(offset, value.size, true);
		offset += 4;
		for (const v of value) {
			offset = this.value_handler.serialize(view, offset, v);
		}
		return offset;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<Set<unknown>> {
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

	constructor(type: TypeWithTypedef) {
		this.type = type;
		this.typedef = type.typedef ?? [];
	}

	sizeof(value: Record<string, unknown>): number {
		let res = 0;
		for (let i = 0; i < this.typedef.length; i += 1) {
			const def = this.typedef[i]!;
			const fieldHandler = getHandlerObject(def.type);
			res += fieldHandler.sizeof(value[def.field]);
		}
		return res;
	}

	serialize(view: DataView, offset: number, value: Record<string, unknown>): number {
		for (let i = 0; i < this.typedef.length; i += 1) {
			const def = this.typedef[i]!;
			const fieldHandler = getHandlerObject(def.type);
			offset = fieldHandler.serialize(view, offset, value[def.field]);
		}
		return offset;
	}

	deserialize(view: DataView, offset: number): DeserializedResult<Record<string, unknown>> {
		const res = new this.type() as Record<string, unknown>;
		for (let i = 0; i < this.typedef.length; i += 1) {
			const def = this.typedef[i]!;
			const fieldHandler = getHandlerObject(def.type);
			const tmp = fieldHandler.deserialize(view, offset);
			res[def.field] = tmp.value;
			offset = tmp.offset;
		}
		return new DeserializedResult(res, offset);
	}
}
