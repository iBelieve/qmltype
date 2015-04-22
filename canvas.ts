/// QML .pragma library
/// QML .import "sphere/sphere.js" as Sphere
import * as Sphere from "sphere/sphere"

var database = new Sphere.Database("canvase", "Canvas app", "1")

function getCourses(): Course[] {
    return <Course[]>database.query("Course")
}

class Course extends Sphere.ModelObject {
    title: string
    grade: number

    // getPlugins(): Plugin[] {
    //     return <Plugin[]>database.query("Plugin", "projectId = ?", [this._id])
    // }

    static type: Sphere.Type = {
        name: "Course",
        extends: null,
        isAbstract: false,
        properties: {
            "title": "string",
            "grade": "number"
        },
        type: Course
    }
}]

database.register(Course.type)
