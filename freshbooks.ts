/// QML .pragma library
/// QML .import "http.js" as Http
/// QML .import "promises.js" as Promises
import * as Http from "http"
import * as Promises from "promises"

var domain = 'michaelspencer'

function getInvoices(): Promises.Promise {
	var promise = new Promises.Promise()

	var xml = httpGet('invoice.list').done(function(xml) {
		var a = xml.documentElement;
        for (var ii = 0; ii < a.childNodes.length; ++ii) {
            console.log(a.childNodes[ii].nodeName);
        }
	}).error(function(error) {
		var a = error.documentElement;
		console.log(error)
        for (var ii = 0; ii < a.childNodes.length; ++ii) {
            console.log(a.childNodes[ii].nodeName);
        }
	})

	return promise
}

function httpGet(method: string) {
	var request = '<?xml version="1.0" encoding="utf-8"?>\n' +
				  '<request method="' + method + '">\n' +  
				  '</request>'

	return Http.post('https://' + domain + '.freshbooks.com/api/2.1/xml-in', {
			'body': request,
			'headers': {
				'Content-Type': 'application/xml'
			}
		})
}

class Invoice {

}