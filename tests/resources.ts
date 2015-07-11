/// QML .pragma library
/// QML .import "../sphere.js" as Sphere
import * as Sphere from "../sphere"

class TestClass extends Sphere.ModelObject {
    text: string,
    num: number,
    bool: boolean,
    date: Date

    static type: Sphere.Type = {
        name: "TestClass",
        properties: {
            "text" : "string",
            "num": "number",
            "bool": "boolean",
            "date": "date"
        },
        type: TestClass
    }
}
