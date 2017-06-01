'use strict';

import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Reon, { trigger, forward, isSyntheticEvent, getFunctionName } from '../src/index';

describe('Reon', () => {

    it('should trigger the handler with target and arguments', () => {
        const fixt_target = Symbol('target');
        const fixt_properties = { foo: 'bar' };

        const handler = jest.fn(e => {
            expect(e instanceof Reon).toBe(true);
            expect(e.target).toBe(fixt_target);

            expect(e.isDefaultPrevented()).toBeFalsy();
            expect(e.isPropagationStopped()).toBeFalsy();

            for (const key in fixt_properties) {
                expect(e[key]).toBe(fixt_properties[key]);
            }
        });

        Reon.trigger(handler, fixt_target, fixt_properties);
        expect(handler.mock.calls.length).toBe(1);
    });

    it('should ignore non-function handlers without errors', () => {
        const handler = undefined;
        Reon.trigger(handler);
    });

    it('should be able to forward Reon events', () => {
        const fixt_target = Symbol('target');
        const fixt_target2 = Symbol('target2');
        const fixt_properties = { foo: 'bar' };
        const fixt_properties2 = { baz: 'foo' };
        const fixt_event = new Reon(fixt_target2, fixt_properties2);

        const handler = jest.fn(e => {
            expect(e instanceof Reon).toBe(true);
            expect(e.reonEvent instanceof Reon).toBe(true);

            expect(e.target).toBe(fixt_target);
            expect(e.reonEvent.target).toBe(fixt_target2);

            for (const key in fixt_properties) {
                expect(e[key]).toBe(fixt_properties[key]);
            }

            for (const key in fixt_properties2) {
                expect(e.reonEvent[key]).toBe(fixt_properties2[key]);
            }
        });

        Reon.forward(handler, fixt_target, fixt_event, fixt_properties);

        expect(handler.mock.calls.length).toBe(1);
    });

    it('should be able to forward React events', () => {
        const our_key = Symbol('key');
        const fixt_native = Symbol('native');
        const fixt_target = Symbol('target');
        const fixt_properties = { foo: 'bar' };

        const handler = jest.fn(e => {
            expect(e instanceof Reon).toBe(true);
            expect(isSyntheticEvent(e.reactEvent)).toBe(true);
            expect(e.nativeEvent[our_key]).toBe(fixt_native);

            expect(e.target).toBe(fixt_target);

            expect(e.isDefaultPrevented()).toBeFalsy();
            expect(e.isPropagationStopped()).toBeFalsy();

            e.preventDefault();
            expect(e.isDefaultPrevented()).toBeTruthy();
            expect(e.reactEvent.isDefaultPrevented()).toBeTruthy();

            e.stopPropagation();
            expect(e.isPropagationStopped()).toBeTruthy();
            expect(e.reactEvent.isPropagationStopped()).toBeTruthy();

            for (const key in fixt_properties) {
                expect(e[key]).toBe(fixt_properties[key]);
            }
        });

        const button = TestUtils.renderIntoDocument(
            <button onClick={e => Reon.forward(handler, fixt_target, e, fixt_properties)} />
        );
        TestUtils.SimulateNative.click(button, { [our_key]: fixt_native });

        expect(handler.mock.calls.length).toBe(1);
    });

    it('should be able to forward native events', () => {
        const fixt_target = Symbol('target');
        const fixt_properties = { foo: 'bar' };

        const fixt_event = {
            __proto__: new Event('click'),
            preventDefault: jest.fn(() => fixt_event.defaultPrevented = true),
            defaultPrevented: false
        }

        const handler = jest.fn(e => {
            expect(e instanceof Reon).toBe(true);
            expect(e.reactEvent).toBeUndefined();
            expect(e.nativeEvent instanceof Event).toBe(true);

            expect(e.target).toBe(fixt_target);

            expect(e.isDefaultPrevented()).toBeFalsy();
            expect(e.isPropagationStopped()).toBeFalsy();

            e.preventDefault();
            expect(e.isDefaultPrevented()).toBeTruthy();
            expect(e.nativeEvent.defaultPrevented).toBeTruthy();

            e.stopPropagation();
            expect(e.isPropagationStopped()).toBeTruthy();

            for (const key in fixt_properties) {
                expect(e[key]).toBe(fixt_properties[key]);
            }
        });

        Reon.forward(handler, fixt_target, fixt_event, fixt_properties);
        expect(handler.mock.calls.length).toBe(1);
    });

    it('should throw when triggering with a synthetic event', () => {
        const fixt_event = new Reon(undefined, {});

        const test = () => Reon.trigger(undefined, undefined, { e: fixt_event });
        expect(test).toThrow();
    });

    it('should throw when forwarding with a non-event', () => {
        console.error = jest.fn();
        Reon.forward(undefined, undefined, undefined, {});
        expect(console.error).toBeCalled();
    });

    it('should return defaultPrevented/stopPropagation state after trigger', () => {
        const handler = e => {
            e.preventDefault();
            e.stopPropagation();
        };
        const result = Reon.trigger(handler);

        expect(result.isDefaultPrevented()).toBeTruthy();
        expect(result.isPropagationStopped()).toBeTruthy();
    })

    it('should return defaultPrevented/stopPropagation state after forward', () => {
        const handler = e => {
            e.preventDefault();
            e.stopPropagation();
        };
        const fixt_event = new Reon(undefined, {});
        const result = Reon.forward(handler, undefined, fixt_event);

        expect(result.isDefaultPrevented()).toBeTruthy();
        expect(result.isPropagationStopped()).toBeTruthy();
    })

    describe('getFunctionName', () => {

        it('should return the correct function name', () => {
            const f = function helloWorld() {};
            const name = getFunctionName(f);

            expect(name).toBe('helloWorld');
        });

        it('should return the correct funtion name in IE', () => {
            const f = function helloWorld() {};

            // Emulate Internet Explorer which does not have the name property.
            Object.defineProperty(f, 'name', {
                value: false
            });

            const name = getFunctionName(f);
            expect(name).toBe('helloWorld');
        });

        it('should return the correct function name in IE for Function', () => {
            const f = Function;

            // Emulate Internet Explorer which does not have the name property.
            const FunctionDescriptor = Object.getOwnPropertyDescriptor(f, 'name');
            Object.defineProperty(f, 'name', {
                value: false
            });

            const name = getFunctionName(f);
            expect(name).toBe('Function');

            // Reset original descriptor
            Object.defineProperty(f, 'name', FunctionDescriptor);
        });

        it('should not return a name for anonymous functions', () => {
            const f = function() {
                // Babel add the name `f` to the method when we assign it directly.
                return function() {};
            }();

            // Emulate Internet Explorer which does not have the name property.
            Object.defineProperty(f, 'name', {
                value: false
            });

            const name = getFunctionName(f);

            expect(name).toBeUndefined();
        });

        it('should export trigger function', () => {
            const handler = jest.fn(() => {});
            trigger(handler);
            expect(handler.mock.calls.length).toBe(1);
        });

        it('should export forward function', () => {
            const fixt_event = new Reon(undefined, {});
            const handler = jest.fn(() => {});
            Reon.forward(handler, undefined, fixt_event);
            expect(handler.mock.calls.length).toBe(1);
        });

    });

    it('should preserve original property descriptors', () => {
        const eventData = Object.defineProperty({}, 'propTest', {
            configurable: true,
            enumerable: true,
            get: () => 'test success'
        });

        const handler = jest.fn(e => {
            expect(e.propTest).toBe('test success');
        });

        Reon.trigger(handler, undefined, eventData);
        expect(handler.mock.calls.length).toBe(1);
    });

    it('should set descriptors for accessors', () => {
        const eventData = Reon.lazy({
            propTest: () => 'test success',
            propRegular: 'abc',
            propTest2: 1234
        });

        const handler = jest.fn(e => {
            expect(e.propTest).toBe('test success');
            expect(e.propRegular).toBe('abc');
            expect(e.propTest2).toBe(1234);
        });

        Reon.trigger(handler, undefined, eventData);
        expect(handler.mock.calls.length).toBe(1);
    })

});
