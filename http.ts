/*
 * QML Extras - Extra types and utilities to make QML even more awesome
 *
 * Copyright (C) 2014-2015 Michael Spencer <sonrisesoftware@gmail.com>
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
/// QML .import "promises.js" as Promises
import * as Promises from "promises"

enum RequestType {
	POST, PUT, GET
}

export interface BasicAuth {
    username: string
    password: string
}

export interface HttpArgs {
    options?: string[]
    headers?: {}
    body?: string
    basic_auth?: BasicAuth
}

export function post(path: string, args?: HttpArgs) {
    return request(path, RequestType.POST, args)
}

export function patch(path: string, args?: HttpArgs) {
    return request(path, RequestType.PUT, args)
}

export function put(path: string, args?: HttpArgs) {
    return request(path, RequestType.PUT, args)
}

//function delete(path, options, args) {
//    request(path, "DELETE", options, args)
//}

export function get(path: string, args?: HttpArgs) {
    return request(path, RequestType.GET, args)
}

function requestType(type: RequestType): string {
	if (type == RequestType.GET) {
		return "GET"
	} else if (type == RequestType.PUT) {
		return "PUT"
	} else if (type == RequestType.POST) {
		return "POST"
	} else {
		throw "Unrecognized request type" + type
	}
}

function request(path: string, type: RequestType, args: HttpArgs) {
    var address = path
    var call = requestType(type)

    if (!args) args = {}

    var options = args.options ? args.options : []
    var headers = args.headers ? args.headers : {}
    var body = args.body ? args.body : undefined

    if (options.length > 0)
        address += (address.indexOf('?') == -1 ? "?" : "&") + options.join("&").replace(/ /g, "%20")

    console.log(call, address, body)
    console.log("Headers", JSON.stringify(headers))

    var promise = new Promises.Promise()

    var doc = new XMLHttpRequest();
    doc.timeout = 1000;
    doc.onreadystatechange = function() {
        if (doc.readyState === XMLHttpRequest.DONE) {
            //console.log(doc.getResponseHeader("X-RateLimit-Remaining"))

            console.log(doc.responseText)


            var responseArray = doc.getAllResponseHeaders().split('\n')
            var responseHeaders = {}
            for (var i = 0; i < responseArray.length; i++) {
                var header = responseArray[i]
                var items = split(header, ':', 1)
                responseHeaders[items[0]] = items[1]
            }

            console.log("Status:",doc.status, "for call", call, address, headers['If-None-Match'], responseHeaders['etag'])

            promise.info['headers'] = responseHeaders
            promise.info['status'] = doc.status

            if (doc.status == 200 || doc.status == 201 || doc.status == 202 || doc.status === 304) {
                console.log("Calling back with no error...", doc.responseXML)
                if (doc.responseXML)
                	promise.resolve(doc.responseXML)
                else
                	promise.resolve(doc.responseText)
            } else {
                console.log("Calling back with error...", doc.responseXML)
                if (doc.responseXML)
                	promise.reject(doc.responseXML)
                else
                	promise.reject(doc.responseText)
            }
        }
     }
    doc.ontimeout = function () {
        promise.reject("Request timed out: " + address)
    }

    if (args.basic_auth) {
        doc.open(call, address, true,
                args.basic_auth.username,
                args.basic_auth.password);
    } else {
        doc.open(call, address, true);
    }
    
    for (var key in headers) {
        //console.log(key + ": " + headers[key])
        doc.setRequestHeader(key, headers[key])
    }
    if (body)
        doc.send(body)
    else
        doc.send();

    return promise
}

function split(string, sep, limit) {
    var array = []
    for (var i = 0; i < limit; i++) {
        var index = string.indexOf(sep)
        if (index === -1) {
            array.push(string)
            string = undefined
            break;
        } else {
            array.push(string.substring(0, index))
            string = string.substring(index+1)
        }
    }

    if (string !== undefined)
        array.push(string.trim())

    return array
}