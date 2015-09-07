/*
 * QML Extras - Extra types and utilities to make QML even more awesome
 *
 * Copyright (C) 2014 Michael Spencer <sonrisesoftware@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 2.1 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/// QML .pragma library

interface Callback {
  (data: any, info: {}): void;
}

export class Promise {
    onThen: Callback[]
    onDone: Callback[]
    onError: Callback[]
    info: {}

    constructor() {
        this.onThen = []
        this.onDone = []
        this.onError = []
        this.info = {}
    }

    then(handler: Callback): Promise {
        this.onThen.push(handler)
        return this
    }

    done(onResolved: Callback): Promise {
        this.onDone.push(onResolved)
        return this
    }

    error(onError: Callback): Promise {
        this.onError.push(onError)
        return this
    }

    resolve(value) {
        try {
            for (var i = 0; i < this.onThen.length; i++) {
                var handler = this.onThen[i]
                value = handler(value, this.info)
            }

            for (var i = 0; i < this.onDone.length; i++) {
                var handler = this.onDone[i]
                handler(value, this.info)
            }
        } catch (exception) {
            this.reject(exception)
        }
    }

    reject(error) {
        for (var i = 0; i < this.onError.length; i++) {
            var handler = this.onError[i]
            handler(error, this.info)
        }
    }
}

export class DelayedPromise extends Promise {
    constructor(public code: any) {
        super()
    }

    start(args: any[]) {
        return this.code(args)
    } 
}

export class JoinedPromise extends Promise {
    promiseCount: number

    constructor() {
        super()

        this.promiseCount = 0
    }

    add(promise: Promise): JoinedPromise {
        this.promiseCount++

        var join = this

        promise.done(function(data) {
            join.promiseCount--

            if (join.promiseCount == 0) {
                console.log("All joined promises done!")
                join.resolve(data)
            }
        })

        promise.error(function(error) {
            join.promiseCount = -1

            console.log("A joined promise failed, shortcutting to failure!")
            join.reject(error)
        })

        return this
    }
}