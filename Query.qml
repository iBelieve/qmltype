import QtQuick 2.0
import "sphere.js" as Sphere

ListModel {
    id: model

    property string query: ""
    property string sortBy: "_id"

    /*!
      This is necessary so that the ListView sections correctly update.

      Set this property to the name of a property in your model object (it can
      include subproperties, seperated by `.`), and then in your ListView, set
      section.property to "section".
     */
    property string groupBy: ""
    property bool sortAscending: true

    property string type

    property var data: []
    property var objectIds: []

    onQueryChanged: update()

    Component.onCompleted: {
        reload()
        Sphere.objectChanged.connect(function(type, object) {
            if (type !== model.type)
                return

            onObjectChanged(object)
        })

        Sphere.objectDeleted.connect(function(type, object) {
            if (type !== model.type)
                return

            if (objectIds.indexOf(object._id) != -1) {
                _removeId(object._id)
            }
        })
    }

    function onObjectChanged(object) {
        var filter = '_id = ?'

        if (model.query)
            filter += ' AND ' + model.query

        var matchingObject = Sphere.get(object.typeName(), filter, object._id)

        if (matchingObject) {
            updateObject(object)
        } else if (objectIds.indexOf(object._id) != -1) {
            _removeId(object._id)
        }
    }

    function updateObject(object) {
        if (objectIds.indexOf(object._id) == -1) {
            print("Section[%1]".arg(groupBy), _get(object, groupBy))

            data.push(object)

            // Add it at the right location
            if (sortBy == "") {
                objectIds.push(object._id)
                model.append({'modelData': object, "section": _get(object, groupBy)})
            } else {
                sort()

                var index = objectIds.indexOf(object._id)
                print("Inserting object at index", index)
                model.insert(index, {'modelData': object, "section": _get(object, groupBy)})
            }
        } else {
            var currentIndex = objectIds.indexOf(object._id)

            model.data[currentIndex] = object
            sort()

            var newIndex = objectIds.indexOf(object._id)

            model.move(currentIndex, newIndex, 1)
            print("Replacing object at index", newIndex)
            model.set(newIndex, {'modelData': object, "section": _get(object, groupBy)})
        }
    }

    function update() {
        var objects = Sphere.query(type, model.query)
        var newIds = listOfIds(objects)

        objects.forEach(function (object) {
            updateObject(object)
        })


        // Remove any documents that are currently in the model but not in the query
        var i = 0;
        while (i < objectIds.length) {
            var docId = objectIds[i]

            if (newIds.indexOf(docId) == -1) {
                _removeId(docId)
            } else {
                i++
            }
        }
    }

    function _removeId(id) {
        print("Removing item from model...")
        model.remove(objectIds.indexOf(id))
        objectIds.splice(objectIds.indexOf(id), 1)
        data.splice(data.indexOf(id), 1)
    }

    function reload() {
        model.clear()

        data = Sphere.query(type, model.query)

        sort()

        data.forEach(function(item) {
            model.append({
                "modelData": item,
                "section": item[groupBy]
            })
        })
    }

    function sort() {
        var list = sortBy.split(",")

        data = data.sort(function (b, a) {
            for (var i = 0; i < list.length; i++) {
                var prop = list[i]

                var value1 = _get(a, prop)
                var value2 = _get(b, prop)
                var type = typeof(value1)

                if (!isNaN(value1) && !isNaN(value2))
                    type = 'number'
                if (value1 instanceof Date)
                    type = 'date'

                var sort = 0

                if (type == 'boolean') {
                    sort = Number(value2) - Number(value1)
                } else if (type == 'string') {
                    sort = value2.localeCompare(value1)
                } else if (type == 'date') {
                    sort = value2 - value1
                } else {
                    sort = Number(value2) - Number(value1)
                }

                sort = sort * (sortAscending ? 1 : -1)

                if (sort != 0)
                    return sort
            }
        })

        objectIds = listOfIds(data)
    }

    function listOfIds(objects) {
        var list = []

        objects.forEach(function (object) {
            list.push(object._id)
        })

        return list
    }

    function _get(obj, prop) {
        if (prop.indexOf('.') === -1) {
            return obj[prop]
        } else {
            var items = prop.split('.')

            for (var i = 0; i < items.length; i++) {
                obj = obj[items[i]]
                if (obj === undefined)
                    return obj
            }

            return obj
        }
    }
}