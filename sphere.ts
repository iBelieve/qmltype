/// <reference path="./localstorage.d.ts"/>
/// QML .pragma library
/// QML .import QtQuick.LocalStorage 2.0 as SQL
/// QML .import "dateutils.js" as DateUtils
import * as DateUtils from "dateutils"

var database: SQL.LocalStorage
var types: { [name: string]: Type }

export function open(name: string, description: string, version: string) {
    database = SQL.LocalStorage.openDatabaseSync(name, "", description, 100000);
    types = {}

    if (database.version !== version) {
        database.changeVersion(database.version, version, function (tx) {
            if (database.version === "") {
                var sql = 'CREATE TABLE IF NOT EXISTS metadata(name TEXT UNIQUE, value TEXT)'
                console.log("Creating db...")
                tx.executeSql(sql);
            }
        })
        database = SQL.LocalStorage.openDatabaseSync(name, "", description, 100000);
    }
}

export function register(type: Type) {
    var name: string = type.name

    types[name] = type

    if (!type.hasOwnProperty("isAbstract") || !type.isAbstract) {
        var sql = 'CREATE TABLE IF NOT EXISTS %1(_id TEXT UNIQUE%2)'
        var args = ''

        var properties = allPropertiesForType(type)

        for (var prop in properties) {
            var sqlType = 'TEXT'
            var jsType = properties[prop]

            if (jsType == 'number' ||
                    jsType == 'boolean')
                sqlType = 'FLOAT'
            if (jsType == 'date')
                sqlType = 'DATE'

            args += ', ' + prop + ' ' + sqlType
        }

        sql = sql.arg(name).arg(args);

        database.transaction(function(tx){
            tx.executeSql(sql);
        });
    }
}

export function get(type: string, queryString?: string, args?: string[]): ModelObject {
    var results = query(type, queryString, args)

    if (results.length == 1)
        return results[0]
    else
        return null
}

export function query(typeName: string, queryString?: string, args?: string[]): ModelObject[] {
    var results:ModelObject[] = []

    if (!args) args = []

    if (!(typeName in types))
        throw "Unregistered type: " + typeName

    var type = types[typeName]

    if (!type.isAbstract) {
        database.readTransaction(function(tx) {
            var sql = 'SELECT * FROM ' + typeName
            if (queryString != "" && queryString != undefined)
                sql += ' WHERE ' + queryString
            console.log(sql)

            var rows = tx.executeSql(sql, args).rows
            for(var i = 0; i < rows.length; i++) {
                results.push(loadFromData(typeName, rows.item(i)))
            }
        })
    }

    for (var name in types) {
        if (types[name].extends == typeName)
            results = results.concat(query(name, queryString, args))
    }

    return results
}

function loadFromData(type: string, data: {[key: string]: string}) {
    if (type in types) {
        var json = {}

        for (var key in data) {
            var jsType = types[type].properties[key]
            var value: any = data[key]

            if (jsType == 'date') {
                value = new Date(value)
            } else if (jsType == 'number') {
                value = Number(value)
            } else if (jsType == 'json') {
                value = JSON.parse(value)
            } else if (jsType == 'boolean') {
                value = value ? true : false
            }

            json[key] = value
        }

        return new types[type].type(json)
    } else {
        throw "Unregistered type: " + type
    }
}

function subclassesOf(type: Type): Type[] {
    var list: Type[] = []

    Object.keys(types).forEach((value: any, index: number) => {
        if (isSubclass(type, value))
            list.push(value)
    })

    return list
}

function isSubclass(type: Type, subtype: Type) {
    var supertype = subtype

    while (supertype != null) {
        if (supertype.name == type.name) {
            return true
        }

        supertype = types[supertype.extends]
    }

    return false
}

function allPropertiesForType(type: Type): {[key: string]: string} {
    var properties = type.properties

    while (type.extends != null) {
        type = types[type.extends]

        for (var key in type.properties) {
            if (!(key in properties))
                properties[key] = type.properties[key]
        }
    }

    return properties
}

function execSQL(sql: string, args?: string[]): void {
    if (!args)
        args = []

    database.transaction( function(tx){
        tx.executeSql(sql, args);
    });
}

export class ModelObject {
    _id: string

    constructor(json: {[key: string]: string}) {
        if (json) {
            for (var prop in json) {
                this[prop] = json[prop]
            }
        }

        if (!('_id' in this)) {
            this._id = generateID()
        }
    }

    save() {
        console.log(this.typeName())
        console.log(JSON.stringify(this))
        var type = types[this.typeName()]

        var object = this

        database.transaction(function(tx) {
            var args = "'%1'".arg(object._id)
            for (var prop in type.properties) {
                var value = object[prop]

                if (type.properties[prop] == 'date')
                    value = DateUtils.isValid(value) ? value.toISOString() : ""
                else if (typeof(value) == 'object' || type.properties[prop] == 'json')
                    value = JSON.stringify(value)

                args += ", '%1'".arg(value)
            }

            tx.executeSql('INSERT OR REPLACE INTO %1 VALUES (%2)'.arg(type.name).arg(args));
        });

        objectChanged.emit(this.typeName(), this)
    }

    delete() {
        execSQL('DELETE FROM ' + types[this.typeName()].name + " WHERE _id = ?", [this._id])
        objectDeleted.emit(this.typeName(), this)
    }

    typeName() {
        return this["constructor"]["type"]["name"];
    }

    static type: Type
}

class Signal {
    listeners = []

    connect(listener) {
        this.listeners.push(listener)
    }

    emit(...args) {
        this.listeners.forEach((listener: any) => {
            listener.apply(null, args)
        })
    }
}

export interface Type {
    name: string
    properties: {[key: string]: string}
    type: any
    extends?: string
    isAbstract?: boolean
}

function generateID(): string {
    var guid: string = (function() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
      }
      return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
      };
    })()();

    return guid
}

var objectChanged = new Signal()
var objectDeleted = new Signal()
