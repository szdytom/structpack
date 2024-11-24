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
