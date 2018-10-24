'use strict';

// https://github.com/facebook/react/blob/67f8524e88abbf1ac0fd86d38a0477d11fbc7b3e/src/shared/utils/PooledClass.js
import PooledClass from 'react-dom/lib/PooledClass';
import ReactEvent from 'react-dom/lib/SyntheticEvent';

const __PROPERTIES__ = Symbol('Properties set');
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

    const instance = ReonEvent.getPooled(reactElement, properties); // eslint-disable-line no-use-before-define
    handler(instance);

    const prevented = instance.isDefaultPrevented();
    const stopped = instance.isPropagationStopped();
    const result = {
        isDefaultPrevented: () => prevented,
        isPropagationStopped: () => stopped
    };

    ReonEvent.release(instance); // eslint-disable-line no-use-before-define

    return result;
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
        this[__PROPERTIES__] = Object.keys(properties);

        if (typeof properties === 'object')
            Object.defineProperties(this, Object.getOwnPropertyDescriptors(properties));

        this.target = reactElement;
    }

    // Called by PooledClass on release
    destructor() {
        const properties = this[__PROPERTIES__];
        let i = properties.length;
        while( i-- )
            delete this[properties[i]];

        delete this[__DEFAULT_PREVENTED__];
        delete this[__PROPAGATION_STOPPED__];
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

PooledClass.addPoolingTo(ReonEvent, PooledClass.twoArgumentPooler);
