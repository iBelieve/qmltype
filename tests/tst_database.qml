import QtQuick 2.3
import QtTest 1.0
import "../sphere.js" as Sphere
import "../dateutils.js" as DateUtils
import "resources.js" as Resources

TestCase {
    name: "DatabaseTests"

    function initTestCase() {
        Sphere.open("sphere-tests", "Unit tests for sphere", "1")
        Sphere.register(Resources.TestClass.type)
    }

    function init() {
        Sphere.deleteAll(Resources.TestClass.type)
    }

    function test_open() {
        // Open was called as part of the init methiod. All we do is verify it worked
        verify(Sphere.database != undefined, "The database should not be undefined")
    }

    function test_register() {
        // Register was called as part of the init methiod. All we do is verify it worked
        compare(Sphere.types['TestClass'], Resources.TestClass.type,
                "The test class should have been registered")
    }

    function test_save_data() {
        return [
            {text: "ABC", num: 4, date: new Date(), bool: true}, // Basic valid date
            {text: "ABC", num: 4.2, date: new Date(), bool: true}, // Decimal number
            {text: "ABC", num: 4.2, date: undefined, bool: true}, // No date
            {text: "ABC", num: 4.2, date: new Date("test"), bool: true}, // Invalid date
            {text: "ABC", num: 4.2, date: new Date(), bool: false}, // Boolean "false"
            {text: null, num: 4, date: new Date(), bool: true}, // Null data
            {}, // No data
        ]
    }

    function test_save(data) {
        var testObject = new Resources.TestClass(data)

        testObject.save()

        Sphere.database.readTransaction(function(tx) {
            var sql = 'SELECT * FROM TestClass WHERE _id = ?'

            var rows = tx.executeSql(sql, testObject._id).rows
            compare(rows.length, 1, "There should be only one instance of the test object")

            var match = rows.item(0)
            console.log(JSON.stringify(match))

            var dateString = data['date'] 
                    ? DateUtils.isValid(data['date'])  ? data['date'].toISOString() : ""
                    : undefined

            nullCompare(match['text'], data['text'], "The text property should be set correctly")
            nullCompare(match['num'], data['num'], "The number property should be set correctly")
            nullCompare(match['bool'], data['bool'] === undefined ? undefined : data['bool'] ? 1 : 0, 
                    "The boolean property should be set correctly")
            nullCompare(match['date'], dateString,
                    "The date property should be set correctly")
        })
    }

    function test_get() {
        var testObject = new Resources.TestClass()
        testObject.text = "ABCDEFGHIJKLM"
        testObject.num = 123.5
        testObject.date = new Date("7/10/2015")
        testObject.bool = false

        testObject.save()

        var matchObject = Sphere.get("TestClass", "_id = ?", [testObject._id])

        compare(matchObject.text, testObject.text,
                "The text property should match the original value")
        compare(matchObject.num, testObject.num,
                "The number property should match the original value")
        compare(matchObject.date, testObject.date,
                "The date property should match the original value")
        compare(matchObject.bool, testObject.bool,
                "The boolean property should match the original value")
    }

    function test_query() {
        var obj1 = new Resources.TestClass()
        obj1.text = "First object"
        var obj2 = new Resources.TestClass()
        obj2.text = "Second object"

        obj1.save()
        obj2.save()

        var matches = Sphere.query("TestClass")

        compare(matches.length, 2, "There should be two matching objects")
        compare(matches[0].text, obj1.text, "The first object should be returned first")
        compare(matches[1].text, obj2.text, "The second object should be returned second")
    }

    function nullCompare(actual, expected, msg) {
        if (actual == null) actual = undefined
        if (expected == null) expected = undefined

        return compare(actual, expected, msg)
    }
}
