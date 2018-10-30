'use strict';

import ReactEvent from 'react-dom/lib/SyntheticEvent';

const __DEFAULT_PREVENTED__ = Symbol('Default prevented');
const __PROPAGATION_STOPPED__ = Symbol('Propagation stopped');

export const isSyntheticEvent = function(e) {
    return (
        e instanceof ReonEvent || // eslint-disable-line no-use-before-define
        e instanceof ReactEvent
    );
};

function executeEvent(handler, reactElement, properties) {
    if (typeof handler != 'function')
        return;

    const instance = new ReonEvent(reactElement, properties); // eslint-disable-line no-use-before-define
    handler(instance);

    return instance;
}

export default
class ReonEvent {

    static lazy(properties, object = {}) {
        const descriptors = {};
        Object.keys(properties).forEach(key => {
            const descriptor = { configurable: true, enumerable: true };

            if (typeof properties[key] == 'function') {
                descriptor.get = properties[key];
            } else {
                descriptor.writable = false;
                descriptor.value = properties[key];
            }

            descriptors[key] = descriptor;
        });

        return Object.defineProperties(object, descriptors);
    }

    static trigger(handler, reactElement, properties = {}) {
        if (__DEV__) {
            Object.keys(properties).forEach(key => {
                if (isSyntheticEvent(properties[key]))
                    throw new Error('Please use ReonEvent.forward.');
            });
        }

        return executeEvent(handler, reactElement, properties);
    }

    static forward(handler, reactElement, forwardedEvent, properties = {}) {
        let reonEvent, reactEvent, nativeEvent;

        if (forwardedEvent instanceof ReonEvent) {
            reonEvent = forwardedEvent;
            reactEvent = forwardedEvent.reactEvent;
            nativeEvent = forwardedEvent.nativeEvent;
        } else if (forwardedEvent instanceof Event){
            nativeEvent = forwardedEvent;
        } else if (isSyntheticEvent(forwardedEvent)) {
            reactEvent = forwardedEvent;
            nativeEvent = forwardedEvent.nativeEvent;
        } else if (__DEV__) {
            console.error('If forwardedEvent is not an event you should be using ReonEvent.trigger.');
        }

        return executeEvent(handler, reactElement, {
            ...properties,
            reonEvent,
            reactEvent,
            nativeEvent
        });
    }

    constructor(reactElement, properties) {
        if (typeof properties === 'object')
            Object.defineProperties(this, Object.getOwnPropertyDescriptors(properties));

        this.target = reactElement;
    }

    preventDefault() {
        this[__DEFAULT_PREVENTED__] = true;

        if (this.reactEvent)
            this.reactEvent.preventDefault();
        else if (this.nativeEvent)
            this.nativeEvent.preventDefault();
    }

    stopPropagation() {
        this[__PROPAGATION_STOPPED__] = true;

        if (this.reactEvent)
            this.reactEvent.stopPropagation();
        else if (this.nativeEvent)
            this.nativeEvent.stopPropagation();
    }

    isDefaultPrevented() {
        return !!this[__DEFAULT_PREVENTED__];
    }

    isPropagationStopped() {
        return !!this[__PROPAGATION_STOPPED__];
    }

}

export const trigger = ReonEvent.trigger;
export const forward = ReonEvent.forward;
export const lazy = ReonEvent.lazy;
