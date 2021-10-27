# What should be considered a walker?
This is quite a controversial topic, so we're setting things clear in this document.

## Parser functions
These are functions that manage the `walk()` function of a high-level walker. These may be used by any kind of walker. Examples are:

* `parse()` - the top-level function for the parser (uses defaultWalker).
* `parseExpression()` - a function that gets called by low-level walkers and calls the `walk()` function of the expression walker until a given symbol is reached. It returns an expression node. (uses expressionWalker)

## Walkers
A walker is a function that takes in a parser and walks through tokens to achieve a certain task. They can be split up into 2 levels:

* **High level**: There is one high-level walker for each context. They go through each possible token type for that context. Their task is to find out what task should be accomplished using the context and the tokens given. After they found that out (e.g. by checking the current token's type), they call a corresponding low-level walker. Example:
    * `defaultWalker` - the walker used by the `parse()` function by default, it is used to parse regular code. It may be overridden with, for example, `expressionWalker`, when using `parseExpression()`.

* **Low level**: These are the small types of walkers. They only achieve **1** specific task. In doing so, they may call more low level walkers. Example:
    * `parseFunctionArguments()` - a function that gets called by the function call low-level walker. It checks if the next token is a comma, otherwise it calls the `parseExpression()` parser function with the comma as a symbol to look out for.