// First, you import these classes
import { BaseTypeHandler, DeserializedResult, BASIC_TYPES, serializeToBinary, deserializeFromBinary } from 'structpack';

// UUID library
import { stringify, parse, v4 as uuidv4 } from 'uuid';

// Then, you define your custom type handle extending BaseTypeHandler
class UUIDHandler extends BaseTypeHandler {
	// In this case, we don't need a constructor
	// But you can use it to pass arguments to your custom type

	// This method is called when serializing
	// It should return the size of the serialized value
	sizeof(_value) {
		// In this case, we know that the serialized value will always be 16 bytes
		// In other cases, you can calculate the size based on the value
		return 16;
	}

	// This method is called when serializing
	// It should return the serialized value
	serialize(view, offset, value) {
		// view is a DataView object, refer to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
		// offset is the offset in the buffer where the value should be serialized

		const buf = parse(value);
		for (let i = 0; i < 16; i++) {
			view.setUint8(offset + i, buf[i]);
		}

		// Return the offset of the next value
		return offset + 16;
	}

	// This method is called when deserializing
	// It should return a DeserializedResult object
	deserialize(view, offset) {
		const buf = Buffer.from(view.buffer, offset, 16);

		// DeserializedResult is a class that wraps the deserialized value and the offset of the next value
		return new DeserializedResult(stringify(buf), offset + 16);
	}
}

// Let's try it out
const UUIDType = new UUIDHandler();
const uuid = '50f4696d-6561-4195-865a-2b9fb35ad136';
const binary = serializeToBinary(uuid, UUIDType);
const deserialized = deserializeFromBinary(binary, UUIDType);

console.log(deserialized); // 50f4696d-6561-4195-865a-2b9fb35ad136

// We can also use it in a struct
class Account {
	constructor(name, balance) {
		if (name === undefined) {
			// Deserialization, do nothing and wait for the deserializer to fill the properties
			return;
		}

		this.name = name;
		this.balance = balance;
		
		// create a new uuid
		this.id = uuidv4();
	}

	// You can add methods to the class, whatever you want
	deposit(amount) {
		this.balance += amount;
	}

	// Don't forget to add the typedef
	static typedef = [
		{ field: 'id', type: UUIDType },
		{ field: 'name', type: BASIC_TYPES.str },
		{ field: 'balance', type: BASIC_TYPES.i32 },
	];
}

// Now we can serialize and deserialize the Account class
const binary2 = serializeToBinary(new Account('Thomas Sledison', 1000), Account);
const thomas = deserializeFromBinary(binary2, Account);

console.log(thomas.name); // Thomas Sledison
console.log(thomas.balance); // 1000
console.log(thomas.id); // (random uuid) notable that the id is a string but not a buffer