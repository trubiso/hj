# Types on HJ
This is yet another controversial topic, our point of view on types is described below.

## Dot Access
Before explaining each type, we should first explain what dot access is. It is the operator via which you can access any property / function of a variable. For example, an array symbol could have a `.push()` function attached so you can do `array arr = [3, 4]; arr.push)(5);`, where the expected behavior would be that the array's contents would be modified to `[3, 4, 5]`.


## Primitive types
These are the simplest types. They cannot be broken down to smaller types. They do not have dot-access as literals, but they gain it when they're put into symbols.

### num (NumberLiteral)
This type contains a number - whether it's an int, a float, a double, a long...

### string (StringLiteral)
This type contains a string - a sequence of characters. String symbols should probably have the dot access for things like .length, .toLowerCase(), etc.

### bool (Boolean)
This type has only two possible values - either true or false. They are equivalent to the numbers 1 and 0. 

### Question: Allow dot access for primitive types?
The main problem with not allowing it would be that strings could make good use of them. If you don't allow dot access on primitive types you'd have to use functions instead, e.g. `length(string)` and `lower(string)`.

#### Are strings considered primitive types?
They're technically made out of characters, aren't they? They are when the code gets compiled, but in our interpretation they aren't really. Java solves this by having two types of strings: primitive ones and object strings (although this is probably a bit complicated for our project). Perhaps we should consider strings semi-primitives, allowing dot access even though they are not object types.
But how should we implement semi-primitives? It would be a bit awkward in code to check if it's either an object-type or a string. Instead of setting strings as primitives we will consider them objects in code - they have the same properties as them - therefore avoiding writing the same code for 2 type types.


## Object types
Object types are compound types made out of primitive types. They have dot access as literals and as symbols.

### frac (Fraction)
This type contains a fraction - a ratio between 2 integers (not to be confused with 2 numbers, a fraction can **not** have decimals). It can be used to perform complex fraction operations, for example: `(3/4 + 3/5) * 32/27`. They can be (and are automatically per operation) simplified. Upon stringifying, they follow the format `{numerator}/{denominator}`.

### array (Array)
This type contains a collection of untyped values, meaning that they contain a set of values that can have any type. For example, `[3/4, 5, false, "hi"]` would be a perfectly reasonable array. They require dot access for simple operations such as pushing values into the array.

#### Array functions:
| Method | Description |
| --- | --- |
`.has(item)` | Returns whether the array has a specified item or not. **Implemented**
`.join(separator?)` | Joins every item of the array, separating them with the provided separator (which may be an empty string). **Implemented**
`.prepend(item)` | Adds an item at the beginning of the array and returns the new array length. **Implemented**
`.append(item)` | Adds an item to the end of an array and returns the new array length. **Implemented**
`.pop(n?)` | Removes & returns the last n elements of the array. n defaults to 1. **Implemented**
`.shift(n?)` | Removes & returns the first n elements of the array. n defaults to 1. **Implemented**
`.first(n?)` | Returns the first n elements of the array. n defaults to 1. **Implemented**
`.last(n?)` | Returns the last n elements of the array. n defaults to 1. **Implemented**
`.reverse()` | Reverses & returns the array. **Implemented**
`.insert(item, index)` | Inserts an item at an index and returns the new array length. **Implemented**
`.delete(index, amount?)` | Deletes an element at an index (if amount is specified, it deletes the amount of elements from that index). **Implemented**
`.pick()` | Returns a random element from the array. **Implemented**
`.shuffle()` | Returns the shuffled version of the array. **Implemented**
`.unique()` | Removes & returns duplicate elements from the array. **Implemented**
`.fill(item, length?)` | Fills & returns the array with a specified item. If `length` is specified, the array's length will be replaced with it before filling. **Implemented**
`.h()` | h **Implemented**
`.j()` | j **Implemented**
`.filter(filterFunction)` | Filters every element in the array through a provided function.* (functions aren't yet implemented)
`.find(findFunction)` | Finds & returns an element using the provided find function.* (functions aren't yet implemented)
`.findIdx(findFunction)` | Finds an element using the provided find function and returns its index.* (functions aren't yet implemented)
`.idxOf(item, multiple?)` | Returns the index of the first occurrence of the item in the array. If the multiple parameter is passed in as `true`, it returns an array with the indexes of all occurrences.* (not sure about it)
`.map(mapFunction)` | Passes every element of the array through a function and returns them.* (functions aren't yet implemented)
`.slice(start, end, step)` | Returns a slice of the array.* (pythonic arrays might replace this)
`.all(conditionFunction)` | Returns whether all elements follow a condition described in a function.* (functions aren't yet implemented)
`.one(conditionFunction)` | Returns whether at least one element follows a condition described in a function.* (functions aren't yet implemented)
`.sort(sortFunction)` | Sorts and returns the array using a function.* (functions aren't yet implemented)
`.toString()` | Returns the stringified array.* (`stringify(array)` would also work)
`.reduce(reduceFunction, reverse)` | Returns all of the elements of the array reduced using a function. If `reverse` is true, the elements get reduced using the reversed array.* (functions aren't yet implemented)


\* The function concept is still in the works, perhaps it will removed, renamed or replaced.

## Special types
This is a subject we haven't fully thought about yet. We have some prototypes but nothing is definitive.

### function (Function)
_not now :)_ (the current syntax is `function name = (num a, frac b, bool c) => string { /* code here */ };`, subject to changes)