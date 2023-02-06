# IMPORT
Put all `imports` above non-import statements

`type import` should be separated from the import and after `imports`

```
import { StyleSheet, Image, Platform, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
````
# Naming Conventions
Avoid single letter names. Be descriptive with your naming
Use camelCase when naming objects, functions, and instances
Use PascalCase only when naming constructors or classes
Do not use trailing or leading underscores
(leading underscore is a common convention to mean “private”)

# COMPONENT
Component should be simply named without any typing (FC, PureCommpoent etc)

Component should be defined as a function and not as a class (as much as possible)

Component Props should be defined as a type and use the following naming convention: `ComponentNameProps`

````
type HomeScreenProps= {}
const HomeScreen= ({}: HomeScreenProps) => {
  return (
    <View>
      <Text>HomeScreen</Text>
    </View>
  );
};

export default HomeScreen
```

# HOC
Avoid inlining HOCs in the component definition. Instead, create a new component and wrap the component with the HOC.


Replace
```
const ForwardedComponent = forwardRef({}, ref) => {
  return (
    <View>
      <Text>HomeScreen</Text>
    </View>
  );
};

export default ForwardedComponent
```

By 
```
const Component = ({}, ref) => {
  return (
    <View>
      <Text>HomeScreen</Text>
    </View>
  );
};

export default forwardRef(Component)
```


# References
Use const for all of your references; avoid using var
If you must reassign references, use let instead of var.
Don't use var


# Objects
Use computed property names when creating objects with dynamic property names.
```
function getKey(k) {
  return `a key named ${k}`;
}

// bad
const obj = {
  id: 5,
  name: 'San Francisco',
};
obj[getKey('enabled')] = true;

// good
const obj = {
  id: 5,
  name: 'San Francisco',
  [getKey('enabled')]: true,
};`
```

Only quote properties that are invalid identifiers.
// bad
const bad = {
  'foo': 3,
  'bar': 4,
  'data-blah': 5,
};

// good
const good = {
  foo: 3,
  bar: 4,
  'data-blah': 5,
};

# Arrays

# DESTRUCTURING
Use object destructuring for multiple return values, not array destructuring. You can add new properties over time or change the order of things without breaking call sites.
`
```
// bad
function processInput(input) {
  // then a miracle occurs
  return [left, right, top, bottom];
}

// the caller needs to think about the order of return data
const [left, __, top] = processInput(input);

// good
function processInput(input) {
  // then a miracle occurs
  return { left, right, top, bottom };
}

// the caller selects only the data they need
const { left, top } = processInput(input);
```

# Arrow Function
Avoid as much as possible to use arrow function in the render method of a component