import { describe, it, expect } from 'vitest';
import { BASIC_TYPES, serializeToBinary, deserializeFromBinary } from '../dist/index.js';

function areArrayBuffersEqual(buffer1: ArrayBuffer | Uint8Array, buffer2: ArrayBuffer | Uint8Array): boolean {
	if (buffer1.byteLength !== buffer2.byteLength) {
		return false;
	}

	const view1 = new DataView((buffer1 as Uint8Array).buffer ?? (buffer1 as ArrayBuffer));
	const view2 = new DataView((buffer2 as Uint8Array).buffer ?? (buffer2 as ArrayBuffer));

	for (let i = 0; i < buffer1.byteLength; i += 1) {
		if (view1.getUint8(i) !== view2.getUint8(i)) {
			return false;
		}
	}

	return true;
}

function areSetsEqual(set1: Set<unknown>, set2: Set<unknown>): boolean {
	if (set1.size !== set2.size) {
		return false;
	}
	for (const item of set1) {
		if (!set2.has(item)) {
			return false;
		}
	}
	return true;
}

class Point {
	x: number;
	y: number;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	foo(): number {
		return this.x + this.y;
	}

	static typedef = [
		{ field: 'x', type: BASIC_TYPES.u8 },
		{ field: 'y', type: BASIC_TYPES.u8 },
	] as const;
}

describe('binary-struct', () => {
	describe('serializeToBinary', () => {
		it('type i8', () => {
			const res = serializeToBinary(-123, BASIC_TYPES.i8);
			const ans = new Uint8Array([0x85]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type i16', () => {
			const res = serializeToBinary(-12345, BASIC_TYPES.i16);
			const ans = new Uint8Array([0xc7, 0xcf]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type i32', () => {
			const res = serializeToBinary(-1234567890, BASIC_TYPES.i32);
			const ans = new Uint8Array([0x2e, 0xfd, 0x69, 0xb6]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type i64', () => {
			const res = serializeToBinary(-1234567890123456789n, BASIC_TYPES.i64);
			const ans = new Uint8Array([0xeb, 0x7e, 0x16, 0x82, 0x0b, 0xef, 0xdd, 0xee]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type u8', () => {
			const res = serializeToBinary(60, BASIC_TYPES.u8);
			const ans = new Uint8Array([0x3c]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type u16', () => {
			const res = serializeToBinary(56789, BASIC_TYPES.u16);
			const ans = new Uint8Array([0xd5, 0xdd]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type u32', () => {
			const res = serializeToBinary(1234567890, BASIC_TYPES.u32);
			const ans = new Uint8Array([0xd2, 0x02, 0x96, 0x49]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type u64', () => {
			const res = serializeToBinary(123456789009876543n, BASIC_TYPES.u64);
			const ans = new Uint8Array([0x3f, 0x46, 0x0b, 0xa6, 0x4b, 0x9b, 0xb6, 0x01]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type string', () => {
			const res = serializeToBinary('hello world', BASIC_TYPES.str);
			const ans = new Uint8Array([0x0b, 0x00, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type u16[]', () => {
			const res = serializeToBinary([0x1770, 0x3c3a, 0x9012], BASIC_TYPES.array(BASIC_TYPES.u16));
			const ans = new Uint8Array([0x03, 0x00, 0x00, 0x00, 0x70, 0x17, 0x3a, 0x3c, 0x12, 0x90]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type u16[3]', () => {
			const res = serializeToBinary([0x1770, 0x3c3a, 0x9012], BASIC_TYPES.FixedArray(3, BASIC_TYPES.u16));
			const ans = new Uint8Array([0x70, 0x17, 0x3a, 0x3c, 0x12, 0x90]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type Point', () => {
			const res = serializeToBinary(new Point(2, 3), Point);
			const ans = new Uint8Array([0x02, 0x03]);
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type Buffer', () => {
			const ans = new Uint8Array([0x3c, 0x3d, 0x3e, 0x3f]).buffer;
			const res = serializeToBinary(Buffer.from(ans), BASIC_TYPES.raw(4));
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});

		it('type StringMap', () => {
			const res = serializeToBinary(new Map([['aa', 'b'], ['hi', 'hello']]), BASIC_TYPES.StringMap);
			const ans = new Uint8Array([0x02, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x61, 0x61, 0x01, 0x00, 0x00, 0x00, 0x62, 0x02, 0x00, 0x00, 0x00, 0x68, 0x69, 0x05, 0x00, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f]).buffer;
			expect(areArrayBuffersEqual(res, ans)).toBe(true);
		});
	});

	describe('deserializeFromBinary', () => {
		it('type i8', () => {
			const binaryData = new Uint8Array([0x85]).buffer;
			expect(deserializeFromBinary(binaryData, BASIC_TYPES.i8)).toBe(-123);
		});

		it('type i16', () => {
			const binaryData = new Uint8Array([0xc7, 0xcf]).buffer;
			expect(deserializeFromBinary(binaryData, BASIC_TYPES.i16)).toBe(-12345);
		});

		it('type i32', () => {
			const binaryData = new Uint8Array([0x2e, 0xfd, 0x69, 0xb6]).buffer;
			expect(deserializeFromBinary(new Uint8Array(binaryData), BASIC_TYPES.i32)).toBe(-1234567890);
		});

		it('type i64', () => {
			const binaryData = new Uint8Array([0xeb, 0x7e, 0x16, 0x82, 0x0b, 0xef, 0xdd, 0xee]).buffer;
			expect(deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.i64)).toBe(BigInt('-1234567890123456789'));
		});

		it('type u8', () => {
			const binaryData = new Uint8Array([0x3c]).buffer;
			expect(deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.u8)).toBe(60);
		});

		it('type u16', () => {
			const binaryData = new Uint8Array([0xd5, 0xdd]).buffer;
			expect(deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.u16)).toBe(56789);
		});

		it('type u32', () => {
			const binaryData = new Uint8Array([0xd2, 0x02, 0x96, 0x49]).buffer;
			expect(deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.u32)).toBe(1234567890);
		});

		it('type u64', () => {
			const binaryData = new Uint8Array([0x3f, 0x46, 0x0b, 0xa6, 0x4b, 0x9b, 0xb6, 0x01]).buffer;
			expect(deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.u64)).toBe(BigInt('123456789009876543'));
		});

		it('type string', () => {
			const binaryData = new Uint8Array([0x0b, 0x00, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]).buffer;
			expect(deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.str)).toBe('hello world');
		});

		it('type u16[]', () => {
			const binaryData = new Uint8Array([0x03, 0x00, 0x00, 0x00, 0x70, 0x17, 0x3a, 0x3c, 0x12, 0x90]).buffer;
			expect(deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.array(BASIC_TYPES.u16))).toEqual([0x1770, 0x3c3a, 0x9012]);
		});

		it('type u16[3]', () => {
			const binaryData = new Uint8Array([0x70, 0x17, 0x3a, 0x3c, 0x12, 0x90]).buffer;
			expect(deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.FixedArray(3, BASIC_TYPES.u16))).toEqual([0x1770, 0x3c3a, 0x9012]);
		});

		it('type Point', () => {
			const binaryData = new Uint8Array([0x02, 0x03]).buffer;
			const res = deserializeFromBinary(new DataView(binaryData), Point) as Point;
			const ans = new Point(2, 3);
			expect(res.x).toBe(ans.x);
			expect(res.y).toBe(ans.y);
			expect(res.foo()).toBe(ans.foo());
		});

		it('type Buffer', () => {
			const binaryData = new Uint8Array([0x3c, 0x3d, 0x3e, 0x3f]).buffer;
			const res = deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.raw(4));
			expect(res).toEqual(Buffer.from(binaryData));
		});

		it('type StringMap', () => {
			const binaryData = new Uint8Array([0x02, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x61, 0x61, 0x01, 0x00, 0x00, 0x00, 0x62, 0x02, 0x00, 0x00, 0x00, 0x68, 0x69, 0x05, 0x00, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f]).buffer;
			const res = deserializeFromBinary(new DataView(binaryData), BASIC_TYPES.StringMap);
			expect(res).toEqual(new Map([['aa', 'b'], ['hi', 'hello']]));
		});
	});

	describe('serialize and deserialize', () => {
		it('type f32', () => {
			const val = 2008.0925;
			const bin = serializeToBinary(val, BASIC_TYPES.f32);
			expect(bin.byteLength).toBe(4);
			const num = deserializeFromBinary(bin, BASIC_TYPES.f32) as number;
			expect(Math.abs(num - val)).toBeLessThan(0.0001);
		});

		it('type f64', () => {
			const val = 2008.0925;
			const bin = serializeToBinary(val, BASIC_TYPES.f64);
			expect(bin.byteLength).toBe(8);
			expect(deserializeFromBinary(bin, BASIC_TYPES.f64)).toBe(val);
		});

		it('type Date', () => {
			const val = new Date('2008-09-25T00:00:00.000Z');
			const bin = serializeToBinary(val, BASIC_TYPES.DateTime);
			expect(bin.byteLength).toBe(8);
			const num = deserializeFromBinary(bin, BASIC_TYPES.DateTime) as Date;
			expect(num.toISOString()).toBe(val.toISOString());
		});

		it('type Set', () => {
			const type = BASIC_TYPES.set(BASIC_TYPES.u8);
			const val = new Set([1, 2, 3, 7]);
			const bin = serializeToBinary(val, type);
			const set = deserializeFromBinary(bin, type) as Set<unknown>;
			expect(areSetsEqual(set, val)).toBe(true);
		});
	});
});
