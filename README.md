# Reon

Event library for React built to resemble React's internal Synthetic Events

## Trigger new events

```js
import Reon from 'reon';

const Button = (props) => (
    <button onClick={e => {
            Reon.trigger(props.onClick, this, { value: props.label });
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
## Forward Synthetic Events

```js
import Reon from 'reon';

const Button = (props) => (
    <button onClick={e => {
            Reon.forward(props.onClick, this, e, { value: props.label });
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
