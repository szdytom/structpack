export interface BaseTypeHandler<T = unknown> {
	sizeof(value: T): number;
	serialize(view: DataView, offset: number, value: T): number;
	deserialize(view: DataView, offset: number): DeserializedResult<T>;
}

export class DeserializedResult<T = unknown> {
	value: T;
	offset: number;

	constructor(value: T, offset: number) {
		this.value = value;
		this.offset = offset;
	}
}

export type TypeWithTypedef<T extends object = Record<string, unknown>> = {
	new (...args: never[]): T;
	typedef: readonly { field: Extract<keyof T, string>; type: TypeLike }[];
};

export type TypeLike<T = unknown> = BaseTypeHandler<T> | TypeWithTypedef<Record<string, unknown>> | (T extends object ? TypeWithTypedef<T> : never);

export function isBaseTypeHandler(value: unknown): value is BaseTypeHandler {
	return !!value
		&& typeof value === 'object'
		&& typeof (value as { sizeof?: unknown }).sizeof === 'function'
		&& typeof (value as { serialize?: unknown }).serialize === 'function'
		&& typeof (value as { deserialize?: unknown }).deserialize === 'function';
}
