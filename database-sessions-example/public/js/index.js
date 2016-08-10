window.onload = function () {
	callAPI();
}
function callAPI() {
	$.ajax({
		url:'/getusers',
		type: 'POST',
		success: function(data){
			//Data is the flag recieved from the API defined in app.js
			console.log(data);
			//Print true if the query returns rows and false otherwise
		}
	});
}