'use strict';

import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Reon, { isSyntheticEvent } from '../src/index';

describe('Reon', () => {

    it('should trigger the handler with target and arguments', () => {
        const fixt_target = Symbol('target');
        const fixt_properties = { foo: 'bar' };

        const handler = jest.fn(e => {
            expect(e instanceof Reon).toBe(true);
            expect(e.target).toBe(fixt_target);

            for (const key in fixt_properties) {
                expect(e[key]).toBe(fixt_properties[key]);
            }
        });

        Reon.trigger(handler, fixt_target, fixt_properties);
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

});
