/**
 * Copyright 2017, IOOF Holdings Limited.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { loop, getEffect, Effects } from 'redux-loop'
import { namespacedAction } from 'redux-subspace'
import { namespaced } from '../../src'

describe('namespaced', () => {

    const TEST_ACTION = 'TEST_ACTION'

    const COMMAND_ACTION = { type: TEST_ACTION }
    const createEffectAction = (payload) => ({ ...COMMAND_ACTION, payload })

    function fetchUser(user) {
        return Promise.resolve(user)
            .then(createEffectAction)
            .catch(createEffectAction)
    }

    const effectsReducer = (state = 'initial value', action) => {
        switch (action.type) {
            case 'PROMISE':
                return loop(state, Effects.promise(fetchUser, {name: 'John'}))

            case 'CONSTANT':
              return loop(state, Effects.constant(COMMAND_ACTION))

            case 'BATCH':
                return loop(state, Effects.batch([
                    Effects.promise(fetchUser, {name: 'John'}),
                    Effects.constant(COMMAND_ACTION)
                ]))
            case 'NONE':
                return loop(state, Effects.none)

            default:
                return state
        }
    }

    it('should namespace actions created with commands', async () => {
        const namespacedReducer = namespaced('test')(effectsReducer)
        const result = namespacedReducer(undefined, {
            type: 'CONSTANT'
        })

        const actionNamespacer = namespacedAction('test')
        const expected = loop(
            'initial value',
            Effects.constant(actionNamespacer({ type: TEST_ACTION }))
        )
        expect(result).to.deep.equal(expected)
    })

    it('should handle PROMISE command type', async () => {
        const actionNamespacer = namespacedAction('test')
        const namespacedReducer = namespaced('test')(effectsReducer)

        const result = getEffect(namespacedReducer(undefined, {
            type: 'PROMISE'
        }))

        expect(await result.factory()).to.deep.equal(actionNamespacer(createEffectAction()))
    })

    it('should handle CONSTANT command type', () => {
        const actionNamespacer = namespacedAction('test')
        const namespacedReducer = namespaced('test')(effectsReducer)

        const result = getEffect(namespacedReducer(undefined, {
            type: 'CONSTANT'
        }))
        expect(result.action).to.deep.equal(actionNamespacer(COMMAND_ACTION))
    })

    it('should handle BATCH command type', async () => {
        const actionNamespacer = namespacedAction('test')
        const namespacedReducer = namespaced('test')(effectsReducer)

        const result = getEffect(namespacedReducer(undefined, {
            type: 'BATCH'
        }))

        const [promiseEffect, actionEffect] = result.effects

        expect(await promiseEffect.factory()).to.deep.equal(actionNamespacer(createEffectAction()))
        expect(actionEffect.action).to.deep.equal(actionNamespacer(COMMAND_ACTION))
    })
})
