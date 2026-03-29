import { type TypeLike } from './contracts.js';
import {
	Int8Handler,
	Int16Handler,
	Int32Handler,
	Int64Handler,
	Uint8Handler,
	Uint16Handler,
	Uint32Handler,
	Uint64Handler,
	Float32Handler,
	Float64Handler,
	BoolHandler,
	DateHandler,
	VoidHandler,
	StringHandler,
} from './scalar.js';
import {
	DynamicArrayHandler,
	FixedArrayHandler,
	RawBufferHandler,
	MapHandler,
	SetHandler,
} from './compound.js';

export const BASIC_TYPES = {
	i8: new Int8Handler(),
	i16: new Int16Handler(),
	i32: new Int32Handler(),
	i64: new Int64Handler(),

	u8: new Uint8Handler(),
	u16: new Uint16Handler(),
	u32: new Uint32Handler(),
	u64: new Uint64Handler(),

	f32: new Float32Handler(),
	f64: new Float64Handler(),

	bool: new BoolHandler(),
	void: new VoidHandler(),
	str: new StringHandler(),
	DateTime: new DateHandler(),

	array: (type: TypeLike) => new DynamicArrayHandler(type),
	FixedArray: (n: number, type: TypeLike) => new FixedArrayHandler(n, type),
	fixedArray: (type: TypeLike, n: number) => new FixedArrayHandler(n, type),
	raw: (n: number) => new RawBufferHandler(n),
	map: (k: TypeLike, v: TypeLike) => new MapHandler(k, v),
	set: (v: TypeLike) => new SetHandler(v),
	StringMap: new MapHandler(new StringHandler(), new StringHandler()),
	stringMap: (valueType: TypeLike) => new MapHandler(new StringHandler(), valueType),
};
