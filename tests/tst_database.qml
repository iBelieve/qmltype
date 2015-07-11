import QtQuick 2.3
import QtTest 1.0
import "../sphere.js" as Sphere
import "resources.js" as Resources

TestCase {
    name: "DatabaseTests"

    function initTestCase() {
        Sphere.open("sphere-tests", "Unit tests for sphere", "1")
        Sphere.register(Resources.TestClass.type)
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

    function test_save() {
        var testObject = new Resources.TestClass()
        testObject.text = "A"
        testObject.num = 4
        testObject.date = new Date()
        testObject.bool = true

        testObject.save()

        Sphere.database.readTransaction(function(tx) {
            var sql = 'SELECT * FROM TestClass WHERE _id = ?'

            var rows = tx.executeSql(sql, testObject._id).rows
            compare(rows.length, 1, "There should be only one instance of the test object")

            var data = rows.item(0)
            console.log(JSON.stringify(data))

            compare(data['text'], "A", "The text property should be set correctly")
            compare(data['num'], 4, "The number property should be set correctly")
            compare(data['bool'], 1, "The boolean property should be set correctly")
            compare(data['date'], testObject.date.toISOString(),
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
}
