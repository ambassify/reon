'use strict';

const __DEFAULT_PREVENTED__ = Symbol('Default prevented');
const __PROPAGATION_STOPPED__ = Symbol('Propagation stopped');
const _isSyntheticEventCache = new Map();

export const isSyntheticEvent = function(e) {
    if (typeof e !== 'object')
        return false;

    if (e instanceof ReonEvent) // eslint-disable-line no-use-before-define
        return true;

    const c = e.constructor;
    if (_isSyntheticEventCache.has(c))
        return _isSyntheticEventCache.get(c);

    /**
     * React v17 detection which does not use event pools
     * https://reactjs.org/blog/2020/08/10/react-v17-rc.html#no-event-pooling
     */
    if (typeof e.persist == 'function' && typeof e.getPooled != 'function') {
        _isSyntheticEventCache.set(c, true);
        return true;
    }

    /**
     * React v15 PooledClass used `instancePool` property,
     * while React v16 Synthentic events use `eventPool`
     */
    const { Interface, getPooled, release, eventPool, instancePool } = c;

    const result = Interface &&
        (Array.isArray(eventPool || instancePool)) &&
        typeof getPooled === 'function' &&
        typeof release === 'function' &&
        typeof Interface.eventPhase !== 'undefined' &&
        typeof Interface.bubbles !== 'undefined';

    _isSyntheticEventCache.set(c, result);

    return result;
};

function executeEvent(handler, reactElement, properties) {
    if (typeof handler != 'function')
        return;

    const instance = new ReonEvent(reactElement, properties); // eslint-disable-line no-use-before-define
    handler(instance);

    const prevented = instance.isDefaultPrevented();
    const stopped = instance.isPropagationStopped();

    return {
        isDefaultPrevented: () => prevented,
        isPropagationStopped: () => stopped
    };
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
