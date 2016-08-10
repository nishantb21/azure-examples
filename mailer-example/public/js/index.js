function sendMail() {
	$.ajax({
		url:'/sendMail',
		type: 'POST',
		data: $("#email").val()
		success: function(data){
			//Data is the flag recieved from the API defined in app.js
			console.log(data);
			//Print true if the email is sent and false otherwise
		}
	});
}