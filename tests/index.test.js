import { BASIC_TYPES, serializeToBinary, deserializeFromBinary } from '../lib/index.mjs';
import assert from 'node:assert/strict';

export function areArrayBuffersEqual(buffer1, buffer2) {
	if (buffer1.byteLength !== buffer2.byteLength) {
		return false;
	}

	const view1 = new DataView(buffer1.buffer ?? buffer1);
	const view2 = new DataView(buffer2.buffer ?? buffer2);

	for (let i = 0; i < buffer1.byteLength; i++) {
		if (view1.getUint8(i) !== view2.getUint8(i)) {
			return false;
		}
	}

	return true;
}

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	foo() {
		return this.x + this.y;
	}
}

Point.typedef = [
	{ field: 'x', type: BASIC_TYPES.u8 },
	{ field: 'y', type: BASIC_TYPES.u8 },
];

describe('binary-struct', () => {
	describe('serializeToBinary', () => {
		it('type i8', () => {
			let res = serializeToBinary(-123, BASIC_TYPES.i8); // Example value for i8
			let ans = new Uint8Array([0x85]); // Byte representation of -123 as i8
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type i16', () => {
			let res = serializeToBinary(-12345, BASIC_TYPES.i16); // Example value for i16
			let ans = new Uint8Array([0xc7, 0xcf]); // Byte representation of -12345 as i16
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type i32', () => {
			let res = serializeToBinary(-1234567890, BASIC_TYPES.i32); // Example value for i32
			let ans = new Uint8Array([0x2e, 0xfd, 0x69, 0xb6]); // Byte representation of -1234567890 as i32
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type i64', () => {
			let res = serializeToBinary(-1234567890123456789n, BASIC_TYPES.i64); // Example value for i64
			let ans = new Uint8Array([0xeb, 0x7e, 0x16, 0x82, 0x0b, 0xef, 0xdd, 0xee]); // Byte representation of -1234567890123456789 as i64
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type u8', () => {
			let res = serializeToBinary(60, BASIC_TYPES.u8); // Example value for u8
			let ans = new Uint8Array([0x3c]); // Byte representation of 60 as u8
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type u16', () => {
			let res = serializeToBinary(56789, BASIC_TYPES.u16); // Example value for u16
			let ans = new Uint8Array([0xd5, 0xdd]); // Byte representation of 56789 as u16
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type u32', () => {
			let res = serializeToBinary(1234567890, BASIC_TYPES.u32); // Example value for u32
			let ans = new Uint8Array([0xd2, 0x02, 0x96, 0x49]); // Byte representation of 1234567890 as u32
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type u64', () => {
			let res = serializeToBinary(123456789009876543n, BASIC_TYPES.u64); // Example value for u64
			let ans = new Uint8Array([0x3f, 0x46, 0x0b, 0xa6, 0x4b, 0x9b, 0xb6, 0x01]); // Byte representation of 123456789009876543 as u64
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type string', () => {
			let res = serializeToBinary('hello world', BASIC_TYPES.str);
			let ans = new Uint8Array([0x0b, 0x00, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]);
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type u16[]', () => {
			let res = serializeToBinary([0x1770, 0x3c3a, 0x9012], BASIC_TYPES.array(BASIC_TYPES.u16));
			let ans = new Uint8Array([0x03, 0x00, 0x00, 0x00, 0x70, 0x17, 0x3a, 0x3c, 0x12, 0x90]);
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type u16[3]', () => {
			let res = serializeToBinary([0x1770, 0x3c3a, 0x9012], BASIC_TYPES.FixedArray(3, BASIC_TYPES.u16));
			let ans = new Uint8Array([0x70, 0x17, 0x3a, 0x3c, 0x12, 0x90]);
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type Point', () => {
			let res = serializeToBinary(new Point(2, 3), Point);
			let ans = new Uint8Array([0x02, 0x03]);
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type Buffer', () => {
			let ans = new Uint8Array([0x3c, 0x3d, 0x3e, 0x3f]).buffer;
			let res = serializeToBinary(Buffer.from(ans), BASIC_TYPES.raw(4));
			assert.ok(areArrayBuffersEqual(res, ans));
		});

		it('type StringMap', () => {
			let res = serializeToBinary(new Map([['aa', 'b'], ['hi', 'hello']]), BASIC_TYPES.StringMap);
			let ans = new Uint8Array([0x02, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x61, 0x61, 0x01, 0x00, 0x00, 0x00, 0x62, 0x02, 0x00, 0x00, 0x00, 0x68, 0x69, 0x05, 0x00, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f]).buffer;
			assert.ok(areArrayBuffersEqual(res, ans));
		});
	});

	describe('deserializeFromBinary', () => {
		it('type i8', () => {
			let binary_data = new Uint8Array([0x85]).buffer;
			let res = deserializeFromBinary(binary_data, BASIC_TYPES.i8);
			let ans = -123;
			assert.equal(res, ans);
		});

		it('type i16', () => {
			let binary_data = new Uint8Array([0xc7, 0xcf]).buffer;
			let res = deserializeFromBinary(binary_data, BASIC_TYPES.i16);
			let ans = -12345;
			assert.equal(res, ans);
		});

		it('type i32', () => {
			let binary_data = new Uint8Array([0x2e, 0xfd, 0x69, 0xb6]).buffer;
			let res = deserializeFromBinary(new Uint8Array(binary_data), BASIC_TYPES.i32);
			let ans = -1234567890;
			assert.equal(res, ans);
		});

		it('type i64', () => {
			let binary_data = new Uint8Array([0xeb, 0x7e, 0x16, 0x82, 0x0b, 0xef, 0xdd, 0xee]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.i64);
			let ans = BigInt('-1234567890123456789');
			assert.equal(res, ans);
		});

		it('type u8', () => {
			let binary_data = new Uint8Array([0x3c]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.u8);
			let ans = 60;
			assert.equal(res, ans);
		});

		it('type u16', () => {
			let binary_data = new Uint8Array([0xd5, 0xdd]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.u16);
			let ans = 56789;
			assert.equal(res, ans);
		});

		it('type u32', () => {
			let binary_data = new Uint8Array([0xd2, 0x02, 0x96, 0x49]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.u32);
			let ans = 1234567890;
			assert.equal(res, ans);
		});

		it('type u64', () => {
			let binary_data = new Uint8Array([0x3f, 0x46, 0x0b, 0xa6, 0x4b, 0x9b, 0xb6, 0x01]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.u64);
			let ans = BigInt('123456789009876543');
			assert.equal(res, ans);
		});

		it('type string', () => {
			let binary_data = new Uint8Array([0x0b, 0x00, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.str);
			let ans = 'hello world';
			assert.equal(res, ans);
		});

		it('type u16[]', () => {
			let binary_data = new Uint8Array([0x03, 0x00, 0x00, 0x00, 0x70, 0x17, 0x3a, 0x3c, 0x12, 0x90]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.array(BASIC_TYPES.u16));
			let ans = [0x1770, 0x3c3a, 0x9012];
			assert.deepEqual(res, ans);
		});

		it('type u16[3]', () => {
			let binary_data = new Uint8Array([0x70, 0x17, 0x3a, 0x3c, 0x12, 0x90]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.FixedArray(3, BASIC_TYPES.u16));
			let ans = [0x1770, 0x3c3a, 0x9012];
			assert.deepEqual(res, ans);
		});

		it('type Point', () => {
			let binary_data = new Uint8Array([0x02, 0x03]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), Point);
			let ans = new Point(2, 3);
			assert.equal(res.x, ans.x);
			assert.equal(res.y, ans.y);
			assert.equal(res.foo(), ans.foo())
		});

		it('type Buffer', () => {
			let binary_data = new Uint8Array([0x3c, 0x3d, 0x3e, 0x3f]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.raw(4));
			assert.deepEqual(Buffer.from(binary_data), res);
		});

		it('type StringMap', () => {
			let binary_data = new Uint8Array([0x02, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x61, 0x61, 0x01, 0x00, 0x00, 0x00, 0x62, 0x02, 0x00, 0x00, 0x00, 0x68, 0x69, 0x05, 0x00, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f]).buffer;
			let res = deserializeFromBinary(new DataView(binary_data), BASIC_TYPES.StringMap);
			let ans = new Map([['aa', 'b'], ['hi', 'hello']]);
			assert.deepEqual(res, ans);
		});
	});

	describe('serialize and deserialize', () => {
		it('type f32', () => {
			let val = 2008.0925;
			let bin = serializeToBinary(Math.PI, BASIC_TYPES.f32);
			assert.equal(bin.byteLength, 4);
			let num = deserializeFromBinary(bin, BASIC_TYPES.f32);
			assert.equal(num, val);
		});

		it('type f64', () => {
			let val = 2008.0925;
			let bin = serializeToBinary(Math.PI, BASIC_TYPES.f64);
			assert.equal(bin.byteLength, 8);
			let num = deserializeFromBinary(bin, BASIC_TYPES.f64);
			assert.equal(num, val);
		});

		it('type Date', () => {
			let val = new Date('2008-09-25T00:00:00.000Z');
			let bin = serializeToBinary(val, BASIC_TYPES.DateTime);
			assert.equal(bin.byteLength, 8);
			let num = deserializeFromBinary(bin, BASIC_TYPES.DateTime);
			assert.equal(num.toISOString(), val.toISOString());
		});
	});
});
