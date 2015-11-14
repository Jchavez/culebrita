

var canvas;

//configuraciones
var config = new Object();
config.grid_size = 20;
config.number_obstacles = 50;
config.square_size = 30;
config.snake_length = 5;
config.search = 'A* - H1';
config.runTimeout = 0;

function init(){
	canvas = document.getElementById('canvas').getContext("2d");
	

	var message = new Object();
	message.do = 'init';
	message.config = config;
	worker.postMessage(message);
}

function refresh_view(data){

	if(data.stats.food >= 10)
		stop();

	document.getElementById('moves_val').innerHTML = data.stats.moves;
	document.getElementById('food_val').innerHTML = data.stats.food;
	document.getElementById('avg_moves_val').innerHTML = data.stats.moves/(data.stats.food);
	document.getElementById('avg_nodes_val').innerHTML = data.stats.count/(data.stats.food);

	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			switch(data.squares[i][j]){
			case 0:
				canvas.fillStyle = "#fff";
				canvas.beginPath();
				canvas.rect(i*config.square_size, j*config.square_size, config.square_size-1, config.square_size-1);
				canvas.closePath();
				canvas.fill();
				canvas.beginPath();
				canvas.rect(i*config.square_size, j*config.square_size, config.square_size, config.square_size);
				canvas.closePath();
				canvas.fillStyle = "#000";
				canvas.stroke();
				break;
			case 1:
				//camino
				canvas.fillStyle = "#BBDEFB";
				canvas.beginPath();
				canvas.rect(i*config.square_size,j*config.square_size, config.square_size, config.square_size);
				canvas.closePath();
				canvas.fill();
				break;
			case 3:
				//muro
				canvas.fillStyle = "#AED581";
				canvas.beginPath();
				canvas.rect(i*config.square_size,j*config.square_size, config.square_size, config.square_size);
				canvas.closePath();
				canvas.fill();
				break;
			case 2:
				//comida
				canvas.fillStyle = "#F44336";
				canvas.beginPath();
				canvas.rect(i*config.square_size,j*config.square_size, config.square_size, config.square_size);
				canvas.closePath();
				canvas.fill();
				break;
			case 4:
				//obstaculos
				canvas.fillStyle = "#3E2723";
				canvas.beginPath();
				canvas.rect(i*config.square_size,j*config.square_size, config.square_size, config.square_size);
				canvas.closePath();
				canvas.fill();
				break;
			default:
				if(data.squares[i][j] == 5){
					//cabeza
					canvas.fillStyle = "#0D47A1";
					canvas.beginPath();
					canvas.rect(i*config.square_size,j*config.square_size, config.square_size, config.square_size);
					canvas.closePath();
					canvas.fill();
					break;
				}
				if(data.squares[i][j] == 4+config.snake_length){
					//cola
					canvas.fillStyle = "#1976D2";
					canvas.beginPath();
					canvas.rect(i*config.square_size,j*config.square_size, config.square_size, config.square_size);
					canvas.closePath();
					canvas.fill();
					break;
				}
				//cuerpo
				canvas.fillStyle = "#1565C0";
				canvas.beginPath();
				canvas.rect(i*config.square_size,j*config.square_size, config.square_size, config.square_size);
				canvas.closePath();
				canvas.fill();
				break;				
			}
		}
	}
}


var worker = new Worker("culebrita-implementacion.js");


worker.onmessage = function(event) {

	if(event.data.type == 'move')
		refresh_view(event.data);
	else
		console.log(event.data);

};


worker.onerror = function(error) {  
	console.log(error.message);
};  


function start(){
	var message = new Object();
	message.do = 'start';
	worker.postMessage(message);
}


function stop(){
	var message = new Object();
	message.do = 'stop';
	worker.postMessage(message);
}

