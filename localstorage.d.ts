declare module SQL {
    export class LocalStorage {
        version: string

        changeVersion(oldVersion: string, newVersion: string, callback)
        transaction(callback)
        readTransaction(callback)

        static openDatabaseSync(name: string, version: string, description: string,
                estimated_size: number, callback?): LocalStorage
    }
}
