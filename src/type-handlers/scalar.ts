import { DeserializedResult, type BaseTypeHandler } from './contracts.js';

export class Int8Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number {
		return 1;
	}
	serialize(view: DataView, offset: number, value: number): number {
		view.setInt8(offset, value);
		return offset + 1;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		return new DeserializedResult(view.getInt8(offset), offset + 1);
	}
}

export class Int16Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 2; }
	serialize(view: DataView, offset: number, value: number): number {
		view.setInt16(offset, value, true);
		return offset + 2;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		return new DeserializedResult(view.getInt16(offset, true), offset + 2);
	}
}

export class Int32Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 4; }
	serialize(view: DataView, offset: number, value: number): number {
		view.setInt32(offset, value, true);
		return offset + 4;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		return new DeserializedResult(view.getInt32(offset, true), offset + 4);
	}
}

export class Int64Handler implements BaseTypeHandler<bigint> {
	sizeof(_value: bigint): number { return 8; }
	serialize(view: DataView, offset: number, value: bigint): number {
		view.setBigInt64(offset, value, true);
		return offset + 8;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<bigint> {
		return new DeserializedResult(view.getBigInt64(offset, true), offset + 8);
	}
}

export class Uint8Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 1; }
	serialize(view: DataView, offset: number, value: number): number {
		view.setUint8(offset, value);
		return offset + 1;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		return new DeserializedResult(view.getUint8(offset), offset + 1);
	}
}

export class Uint16Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 2; }
	serialize(view: DataView, offset: number, value: number): number {
		view.setUint16(offset, value, true);
		return offset + 2;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		return new DeserializedResult(view.getUint16(offset, true), offset + 2);
	}
}

export class Uint32Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 4; }
	serialize(view: DataView, offset: number, value: number): number {
		view.setUint32(offset, value, true);
		return offset + 4;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		return new DeserializedResult(view.getUint32(offset, true), offset + 4);
	}
}

export class Uint64Handler implements BaseTypeHandler<bigint> {
	sizeof(_value: bigint): number { return 8; }
	serialize(view: DataView, offset: number, value: bigint): number {
		view.setBigUint64(offset, value, true);
		return offset + 8;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<bigint> {
		return new DeserializedResult(view.getBigUint64(offset, true), offset + 8);
	}
}

export class Float32Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 4; }
	serialize(view: DataView, offset: number, value: number): number {
		view.setFloat32(offset, value);
		return offset + 4;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		return new DeserializedResult(view.getFloat32(offset), offset + 4);
	}
}

export class Float64Handler implements BaseTypeHandler<number> {
	sizeof(_value: number): number { return 8; }
	serialize(view: DataView, offset: number, value: number): number {
		view.setFloat64(offset, value);
		return offset + 8;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<number> {
		return new DeserializedResult(view.getFloat64(offset), offset + 8);
	}
}

export class BoolHandler implements BaseTypeHandler<boolean> {
	sizeof(_value: boolean): number { return 1; }
	serialize(view: DataView, offset: number, value: boolean): number {
		view.setUint8(offset, value ? 1 : 0);
		return offset + 1;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<boolean> {
		return new DeserializedResult(view.getUint8(offset) !== 0, offset + 1);
	}
}

export class DateHandler implements BaseTypeHandler<Date> {
	sizeof(_value: Date): number { return 8; }
	serialize(view: DataView, offset: number, value: Date): number {
		view.setBigUint64(offset, BigInt(Math.floor(value.getTime() / 1000)), true);
		return offset + 8;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<Date> {
		const timestamp = Number(view.getBigUint64(offset, true));
		return new DeserializedResult(new Date(timestamp * 1000), offset + 8);
	}
}

export class VoidHandler implements BaseTypeHandler<void> {
	sizeof(_value: void): number { return 0; }
	serialize(_view: DataView, offset: number, _value: void): number { return offset; }
	deserialize(_view: DataView, offset: number): DeserializedResult<void> {
		return new DeserializedResult(undefined, offset);
	}
}

export class StringHandler implements BaseTypeHandler<string> {
	sizeof(value: string): number {
		const encodedString = new TextEncoder().encode(value);
		return encodedString.byteLength + 4;
	}
	serialize(view: DataView, offset: number, value: string): number {
		const encodedString = new TextEncoder().encode(value);
		view.setUint32(offset, encodedString.length, true);
		offset += 4;
		for (let i = 0; i < encodedString.length; i += 1) {
			view.setUint8(offset + i, encodedString[i]!);
		}
		return offset + encodedString.length;
	}
	deserialize(view: DataView, offset: number): DeserializedResult<string> {
		const length = view.getUint32(offset, true);
		offset += 4;
		const decodedString = new TextDecoder().decode(new Uint8Array(view.buffer, offset, length));
		return new DeserializedResult(decodedString, offset + length);
	}
}
