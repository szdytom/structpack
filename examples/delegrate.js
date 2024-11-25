import { BaseTypeHandler, BASIC_TYPES, serializeToBinary, deserializeFromBinary } from 'structpack';

class JSONHandler extends BaseTypeHandler {
	sizeof(value) {
		const json = JSON.stringify(value);
		return BASIC_TYPES.str.sizeof(json); // delegate to the string handler
	}

	serialize(view, offset, value) {
		const json = JSON.stringify(value);
		return BASIC_TYPES.str.serialize(view, offset, json); // delegate to the string handler
	}

	deserialize(view, offset) {
		const res = BASIC_TYPES.str.deserialize(view, offset); // delegate to the string handler
		// res is a DeserializedResult object, let's parse the value
		res.value = JSON.parse(res.value);
		return res;
	}
}

const JSONType = new JSONHandler();

const obj = { a: 1, b: 'hello' };
const binary = serializeToBinary(obj, JSONType);
const deserialized = deserializeFromBinary(binary, JSONType);
console.log(deserialized); // { a: 1, b: 'hello' }
