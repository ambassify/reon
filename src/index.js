'use strict';

// https://github.com/facebook/react/blob/67f8524e88abbf1ac0fd86d38a0477d11fbc7b3e/src/shared/utils/PooledClass.js
import PooledClass from 'react/lib/PooledClass';
import ReactEvent from 'react/lib/SyntheticEvent';

const __PROPERTIES__ = Symbol('Properties set');

const _isSyntheticEventCache = {};
export const isSyntheticEvent = function(e) {
    const key = e && e.__proto__ ? e.__proto__.constructor : '__none__';

    if (_isSyntheticEventCache[key])
        return _isSyntheticEventCache[key];

    let value;

    if (e instanceof ReonEvent) // eslint-disable-line no-use-before-define
        value = true;
    else if (!e || !e.__proto__)
        value = false;
    else if (e.__proto__.constructor.name === ReactEvent.name)
        value = true;
    else
        value = isSyntheticEvent(e.__proto__);

    _isSyntheticEventCache[key] = value;
    return value;
};

function executeEvent(handler, reactElement, properties) {
    if (typeof handler != 'function')
        return;

    const instance = ReonEvent.getPooled(reactElement, properties); // eslint-disable-line no-use-before-define
    handler(instance);
    ReonEvent.release(instance); // eslint-disable-line no-use-before-define
}

export default
class ReonEvent {

    static trigger(handler, reactElement, properties = {}) {
        if (__DEV__) {
            Object.keys(properties).forEach(key => {
                if (isSyntheticEvent(properties[key]))
                    throw new Error('Please use ReonEvent.forward.');
            });
        }

        executeEvent(handler, reactElement, properties);
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

        executeEvent(handler, reactElement, {
            ...properties,
            reonEvent,
            reactEvent,
            nativeEvent
        });
    }

    constructor(reactElement, properties) {
        this[__PROPERTIES__] = Object.keys(properties);
        Object.assign(this, properties);
        this.target = reactElement;
    }

    // Called by PooledClass on release
    destructor() {
        const properties = this[__PROPERTIES__];
        let i = properties.length;
        while( i-- )
            delete this[properties[i]];
    }

    preventDefault() {
        if (this.reactEvent)
            this.reactEvent.preventDefault();
        else if (this.nativeEvent)
            this.nativeEvent.preventDefault();
    }

    stopPropagation() {
        if (this.reactEvent)
            this.reactEvent.stopPropagation();
        else if (this.nativeEvent)
            this.nativeEvent.stopPropagation();
    }

    isDefaultPrevented() {
        if (this.reactEvent)
            this.reactEvent.isDefaultPrevented();
        else if (this.nativeEvent)
            this.nativeEvent.defaultPrevented;
        else
            return false;
    }

    isPropagationStopped() {
        // there is no native equivalent for `isPropagationStopped`
        if (!this.reactEvent) return false;

        return this.reactEvent.isPropagationStopped();
    }

}

PooledClass.addPoolingTo(ReonEvent, PooledClass.twoArgumentPooler);
