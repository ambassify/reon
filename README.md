# Reon [![CircleCI](https://circleci.com/gh/ambassify/reon.svg?style=svg)](https://circleci.com/gh/ambassify/reon)

Event library for [React](https://facebook.github.io/react/)

This library acts as a helper dealing with [React's event system](https://facebook.github.io/react/docs/events.html) and ensures a flexible interface between components.

## Installation

### React >= 17.0.0

```
npm install --save reon
```

### React >= 15.4.0 AND < 17.0.0

```
npm install --save reon@^2
```

### React < 15.4.0

```
npm install --save reon@^1
```

## Goals

- Remove some boilerplate from code handling events in React.
- Make the interface of an event more flexible by passing an object in as the only argument.

Instead of writing
```js
if (this.props.onUploadReady)
    this.props.onUploadReady(file);
```

you now write
```js
Reon.trigger(this.props.onUploadReady, { file });
```

## Usage

```
// Trigger new events
Reon.trigger(eventHandler, [objectContainingData]);

// Forward an event previously received from Reon / React
Reon.forward(eventHandler, originalEvent, [objectContainingData]);

// Create eventData object with lazy properties
Reon.lazy(properties, [objectToAttachTo]);
```

The `eventHandler` will receive an object as its first argument which contains all of the properties of `objectContainingData` and optionally the properties `reonEvent`, `reactEvent` and `nativeEvent` when using `Reon.forward`.

- `reonEvent` is added when the forwarded event is an event generated by Reon.
- `reactEvent` is added when the forwarded event is either a [React Synthetic Event](https://facebook.github.io/react/docs/events.html#syntheticevent) or a event generated by Reon. It will point to the original React event that was forwarded.
- `nativeEvent` is added whenever `Reon.forward` is used, it will point to the original event that the browser itself generated.

## Examples

### Trigger new events

```js
import Reon from 'reon';

const Button = (props) => (
    <button onClick={e => {
            Reon.trigger(props.onClick, { value: props.label });
        }}>
        {props.label}
    </button>
);

const App = (props) => (
    <Button label="foo" onClick={e => {
        console.log(e.value);
    }} />
);
```

### Passing synthetic events to the next component.

```js
import Reon from 'reon';

const Button = (props) => (
    <button onClick={e => {
            Reon.forward(props.onClick, e, { value: props.label });
        }}>
        {props.label}
    </button>
);

const App = (props) => (
    <Button label="foo" onClick={e => {
        e.stopPropagation();
        console.log(e.value);
    }} />
);
```

### Creating lazy event properties

```js
import Reon from 'reon';

const Button = (props) => (
    <button onClick={() => {
            Reon.trigger(props.onClick, Reon.lazy({
                button: () => this,
                test: () => 'value of test property'
            }));
        }}>
        {props.label}
    </button>
);

const App = (props) => (
    <Button label="foo" onClick={e => {
        console.log(e.button); // prints Button instance
        console.log(e.test); // prints "value of test property"
    }} />
);
```
## Contributing

If you have some issue or code you would like to add, feel free to open a Pull Request or Issue and we will look into it as soon as we can.

## License

We are releasing this under a MIT License.

## About us

If you would like to know more about us, be sure to have a look at [our website](https://www.ambassify.com), or our Twitter accounts [Ambassify](https://twitter.com/Ambassify), [Sitebase](https://twitter.com/Sitebase), [JorgenEvens](https://twitter.com/JorgenEvens)
