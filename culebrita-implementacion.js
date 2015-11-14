//guarda posicion actual donde esta la comida
function Point(pos_x,pos_y){
	this.x = pos_x;
	this.y = pos_y;
}

function Node(parent,point,children,g_score,h_score){
	this.parent = parent;
	this.point = point;
	this.children = children;
	this.g_score = g_score;
	this.h_score = h_score;
	this.f_score = g_score + h_score;
}

//variables locales
var config = new Object();
var stats = new Object();
stats.moves = 0;
stats.food = 0;
stats.count = 0;
var squares;
var snake;
var food;
var moves = new Array();

//llena array del tamaño del grid y lo llena con comida, obstaculos y con la culebra
function init(){
	squares = new Array(config.grid_size);
	for(var i=0;i<config.grid_size;i++){
		squares[i] = new Array(config.grid_size);
	}
	//Array con valores, llenando de arriba para abajo, 0 significa vacio, 3 muro
	for(var x=0;x<config.grid_size;x++){
		for(var y=0;y<config.grid_size;y++){
			if(x == 0 || y == 0 || x == config.grid_size-1 || y == config.grid_size-1){
				squares[x][y] = 3;
			}else{
				squares[x][y] = 0;
			}
		}
	}
	
	//posicionar culebra, obstaculos y comida
	snake = place_snake(config.snake_length);
	poner_obstaculos(config.number_obstacles);
	poner_comida();
	refresh_view();
}

onmessage = function(event) {
	switch(event.data.do){
		case 'start':
			start();
			break;
		case 'stop':
			stop();
			break;
		case 'init':
			config = event.data.config;
			init();
			break;
	}
}

function run(){
	if(stats.food >= 10){
		clearTimeout(config.runTimeout);
		return;
	}
	
	if(moves.length == 0){

		switch(config.search){
			case 'A* - H1':
				findpath_a("H1");
				break;
			case 'A* - H2':
				findpath_a("H2");
				break;
			case 'A* - (H1+H2)/2':
				findpath_a("H1+H2");
				break;
		}
	}else{

		move(moves.shift());
	}

	refresh_view();

	clearTimeout(config.runTimeout);
	config.runTimeout = setTimeout(run, 100);


//Busqueda A*
function findpath_a(search_type){
	postMessage("running " + search_type);

	var openList = new Array();
	var closedList = new Array(config.grid_size);
	for(var i=0;i<config.grid_size;i++){
		closedList[i] = new Array(config.grid_size);
	}

	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			closedList[i][j] = 0;
		}
	}

	openList.push(new Node(null,snake[0],new Array(),0,heuristic_estimate(snake[0],food,search_type)));

	while (openList.length != 0) {

		openList.sort(function(a,b){return a.f_score - b.f_score})
		var n = openList.shift();
		
		if(closedList[n.point.x][n.point.y] == 1)
			continue;
		stats.count++;

		if (squares[n.point.x][n.point.y] == 2) {

			do{
				moves.unshift(n.point);
				if(squares[n.point.x][n.point.y] == 0)
					squares[n.point.x][n.point.y] = 1;
				n = n.parent;
			}while(n.parent != null)
			break;
		}

		closedList[n.point.x][n.point.y] = 1;
		
	
		if(closedList[n.point.x][n.point.y-1] == 0 && (squares[n.point.x][n.point.y-1] == 0 || squares[n.point.x][n.point.y-1] == 2))
			n.children.unshift(new Node(n,new Point(n.point.x,n.point.y-1),new Array(),n.g_score+1,heuristic_estimate(new Point(n.point.x,n.point.y-1),food,search_type)));
		if(closedList[n.point.x+1][n.point.y] == 0 && (squares[n.point.x+1][n.point.y] == 0 || squares[n.point.x+1][n.point.y] == 2))
			n.children.unshift(new Node(n,new Point(n.point.x+1,n.point.y),new Array(),n.g_score+1,heuristic_estimate(new Point(n.point.x+1,n.point.y),food,search_type)));
		if(closedList[n.point.x][n.point.y+1] == 0 && (squares[n.point.x][n.point.y+1] == 0 || squares[n.point.x][n.point.y+1] == 2))
			n.children.unshift(new Node(n,new Point(n.point.x,n.point.y+1),new Array(),n.g_score+1,heuristic_estimate(new Point(n.point.x,n.point.y+1),food,search_type)));
		if(closedList[n.point.x-1][n.point.y] == 0 && (squares[n.point.x-1][n.point.y] == 0 || squares[n.point.x-1][n.point.y] == 2))
			n.children.unshift(new Node(n,new Point(n.point.x-1,n.point.y),new Array(),n.g_score+1,heuristic_estimate(new Point(n.point.x-1,n.point.y),food,search_type)));
		for(var i=0;i<n.children.length;i++){
			var index = in_openlist(openList,n.children[i]);
			if(index < 0){

				openList.push(n.children[i]);
			}else{
		
				if(n.children[i].f_score < openList[index].f_score){

					for(var j=0;j<openList[index].children.length;j++){
						openList[index].children[j].parent = n.children[i];
					}

					n.children[i].children = openList[index].children;
		
					openList.splice(index,1);
		
					openList.push(n.children[i]);

					update_scores(n.children[i]);
				}
			}
		}
	}
}


function update_scores(parent){
	for(var i=0;i<parent.children.length;i++){
		parent.children[i].g_score = parent.g_score+1;
		parent.children[i].h_score = heuristic_estimate(parent.children[i].point);
		parent.children[i].f_score = parent.children[i].g_score + parent.children[i].h_score;

		update_scores(parent.children[i]);
	}
}


function in_openlist(openList,aNode){
	for(var i=0;i<openList.length;i++){
		if(openList[i].point.x == aNode.point.x && openList[i].point.y == aNode.point.y)
			return i;
	}
	return -1;
}


function heuristic_estimate(point1, point2,search_type){
	switch(search_type){
		case "H1":
			return heuristic_estimate_1(point1,point2);
		case "H2":
			return heuristic_estimate_2(point1,point2);
		case "H1+H2":
			return (heuristic_estimate_1(point1,point2) + heuristic_estimate_2(point1,point2))/2;
	}
}


function heuristic_estimate_1(point1,point2){
	return Math.sqrt(Math.pow(point1.x-point2.x,2) + Math.pow(point1.y-point2.y,2));
}

function heuristic_estimate_2(point1,point2){
	return Math.abs(point1.x-point2.x)+Math.abs(point1.y-point2.y);
}

//inicio
function start(){
	init();
	config.runTimeout = setTimeout(run, 100);
	stats.moves = 0;
	stats.food = 0;
	stats.count = 0;
}

//alto
function stop(){
	clearTimeout(config.runTimeout);
}

//informacion actual para dibujar
function refresh_view(){
	var message = new Object();
	message.type = 'move';
	message.squares = squares;
	message.stats = stats;
	postMessage(message);
}

//mover la culebra al nuevo punto dado por la comida
function move(new_head){
	if((!es_adjacente(new_head,snake[0])) || squares[new_head.x][new_head.y] > 2){
		return false;
	}

	if(squares[new_head.x][new_head.y] == 2){
		poner_comida();
		stats.food++
	}
	
	squares[snake[snake.length-1].x][snake[snake.length-1].y] = 0;
	
	for(var i=snake.length-1;i>0;i--){
		snake[i].x = snake[i-1].x;
		snake[i].y = snake[i-1].y;
	}
	snake[0].x = new_head.x;
	snake[0].y = new_head.y;
	
	for(var i=0;i<snake.length;i++){
		squares[snake[i].x][snake[i].y] = 5+i;
	}
	stats.moves++;
	return true;
}

//movimientos legales
function es_adjacente(point1, point2){
	if(point1.x == point2.x && (point1.y == point2.y-1 || point1.y == point2.y+1))
		return true;
	if(point1.y == point2.y && (point1.x == point2.x-1 || point1.x == point2.x+1))
		return true;
	return false;
}

//Funcion para poner culebra en la matriz
function place_snake(length){
	var middle_x = Math.floor(config.grid_size/2);
	var middle_y = Math.floor(config.grid_size/2);
	var snake = new Array(length);
	while(length){
		squares[middle_x+length][middle_y] = 4+length;
		snake[length-1] = new Point(middle_x+length,middle_y);
		length--;
	}
	return snake;
}


//Funcion para poner 1 comida de modo aleatorio entre el grid dado, 2 para representar comida como valor en la matriz
function poner_comida(){
	do{
		var random_x = Math.floor(Math.random()*(config.grid_size-2))+1;
		var random_y = Math.floor(Math.random()*(config.grid_size-2))+1;
	}while(squares[random_x][random_y] != 0);
	squares[random_x][random_y] = 2;
	food = new Point(random_x,random_y);
}	

//Funcion para poner de manera aleatoria el numero de obstaculos configurados, 4 para llenar el valor de la matriz para indicar obstaculos
function poner_obstaculos(count){
	for(var c=0;c<count;){
		var random_x = Math.floor(Math.random()*(config.grid_size-2))+1;
		var random_y = Math.floor(Math.random()*(config.grid_size-2))+1;
		if(squares[random_x][random_y] == 0){
			squares[random_x][random_y] = 4;
			c++;
		}
	}
}





