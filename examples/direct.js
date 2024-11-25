import { BASIC_TYPES, CompoundTypeHandler, deserializeFromBinary } from 'structpack';

// For built-in types or your custom types
const view = new DataView(new ArrayBuffer(100));
BASIC_TYPES.str.serialize(view, 0, 'Hello, world!');
console.log(deserializeFromBinary(view, BASIC_TYPES.str));

// For structs, you need to create a CompoundTypeHandler
class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	toString() {
		return `(${this.x}, ${this.y})`;
	}

	static typedef = [
		{ field: 'x', type: BASIC_TYPES.f32 },
		{ field: 'y', type: BASIC_TYPES.f32 },
	];
}

const p = new Vec2(1, 2);
const handler = new CompoundTypeHandler(Vec2);
handler.serialize(view, 50, p);

console.log(deserializeFromBinary(new DataView(view.buffer, 50), handler));
