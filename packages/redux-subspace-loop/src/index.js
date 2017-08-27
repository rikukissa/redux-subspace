/**
 * Copyright 2017, IOOF Holdings Limited.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { namespaced as subspaceNamespaced, namespacedAction } from 'redux-subspace'
import { loop, isLoop, Effects, getModel, getEffect } from 'redux-loop'

function namespacedEffect(namespace) {
    const actionNamespacer = namespacedAction(namespace);

    return function namespaceEffect(effect) {

        if (effect.type === 'PROMISE') {
            return Effects.promise((...args) =>
                effect
                    .factory(...args)
                    .then(actionNamespacer)
                    .catch(actionNamespacer),
                ...effect.args
            )
        }

        if (effect.type === 'CONSTANT') {
            return Effects.constant(actionNamespacer(effect.action))
        }

        if (effect.type === 'BATCH') {
            return Effects.batch(effect.effects.map(namespaceEffect))
        }

        return effect
    }
}

export function namespaced(namespace) {
    const namespacer = subspaceNamespaced(namespace)
    const sideEffectNamespacer = namespacedEffect(namespace)

    return reducer => {
        return namespacer((state, action) => {
            const result = reducer(state, action);

            if (isLoop(result)) {
                const model = getModel(result);
                const sideEffect = getEffect(result);
                return loop(model, sideEffectNamespacer(sideEffect));
            }
            return result;
        });
    };

}
