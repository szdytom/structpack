# structpack

A lightweight library for binary serialization and deserialization of custom JavaScript classes in a declative way.

## Features

- **Simple**: No need to write boilerplate code for serialization and deserialization.
- **Declarative**: Define how to serialize and deserialize your classes using a simple typedef.
- **Flexible**: Supports various basic types (e.g., string, number, boolean) and custom classes.
- **Lightweight**: No dependencies (one polyfill you probably already have for browser support), only a few kilobytes in size (minified).

## Installation

```
npm i --save structpack
```

## Quick Start

Here is an example of how to use structpack to serialize and deserialize a class:

```js
import { BASIC_TYPES, serializeToBinary, deserializeFromBinary } from 'structpack';

// Define a normal class with some properties and methods whatever you want
class Person {
	// Note: when deserializing, constructor will be called with no arguments.
	// The properties will be set by the deserializer later.
	// You can check if the first argument is undefined to know if it's a deserialization.
	constructor(name, age, friends) {  
		this.name = name;
		this.age = age;
		this.friends = friends ?? [];
	}

	greet() {
		console.log(`Hello, my name is ${this.name} and I am ${this.age} years old. My friends are:`);
		this.friends.forEach(friend => console.log(`- ${friend}`));
	}

	// Tell structpack how to serialize and deserialize this class
	static typedef = [
		{ field: 'name', type: BASIC_TYPES.str },
		{ field: 'age', type: BASIC_TYPES.u8 },
		{ field: 'friends', type: BASIC_TYPES.array(BASIC_TYPES.str) },
	];
}

// Serialize an instance of Person to binary
// Returns a Buffer in Node.js (Polyfilled in browser)
const binary = serializeToBinary(new Person('Alice', 30, ['Bob', 'Charlie']), Person);

// Deserialize the binary to an instance of Person
const alice = deserializeFromBinary(binary, Person);
alice.greet(); // Hello, my name is Alice and I am 30 years old. My friends are: - Bob - Charlie
```

## API

This library is simple, and only has two functions:

### `serializeToBinary`

```js
serializeToBinary(value, type)
```

### `deserializeFromBinary`

```js
deserializeFromBinary(buffer, type)
```

### Types

It supports the following basic types:

```js
// Signed Integers
BASIC_TYPES.i8
BASIC_TYPES.i16
BASIC_TYPES.i32
BASIC_TYPES.i64

// Unsigned Integers
BASIC_TYPES.u8
BASIC_TYPES.u16
BASIC_TYPES.u32
BASIC_TYPES.u64

// Floating Point Numbers
BASIC_TYPES.f32
BASIC_TYPES.f64

// Strings
BASIC_TYPES.str

// Misc
BASIC_TYPES.void // It does nothing, can be used as a placeholder
BASIC_TYPES.bool
BASIC_TYPES.DateTime // Date object
```

There're also some compound types with arguments:

```js
// Dynamic Array
BASIC_TYPES.array(type)

// Fixed Array
BASIC_TYPES.FixedArray(type, length)

// Map (accepts a Map object, not a plain object!)
BASIC_TYPES.map(keyType, valueType)

// Raw Buffer (with fixed length)
BASIC_TYPES.raw(length)

// String Map (with string keys, functionally equivalent to map(BASIC_TYPES.str, valueType), but can be slightly faster)
BASIC_TYPES.stringMap(valueType)
```

Anything that is not a basic type must be defined with a `typedef` array.

### Advanced Usage

You can also define your own types with a custom serializer and deserializer. For instance, let's say we want to define a custom type that serializes a string to a 16-byte buffer.

```js
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
			view.setUint8(offset + i, buf.readUInt8(i));
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
		{ field: 'balance', type: BASIC_TYPES.i64 },
	];
}

// Now we can serialize and deserialize the Account class
const binary = serializeToBinary(new Account('Thomas Sledison', 1000), Account);
const thomas = deserializeFromBinary(binary, Account);

console.log(thomas.name); // Thomas Sledison
console.log(thomas.balance); // 1000
console.log(thomas.id); // (random uuid) notable that the id is a string but not a buffer
```

## Limitations

- The serialization and deserialization process is not destroying the original object, so if you modify the object after serialization, the deserialization process will not be able to detect the changes.
- The serialization and deserialization process is not designed to handle circular references, so if you have a circular reference in your object, the serialization process will not be able to handle it and it will go into a dead loop.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any suggestions or improvements.

## Licenses

MIT License
