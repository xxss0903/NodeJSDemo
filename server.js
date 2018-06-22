'use strict'

let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);


server.listen(5757, function () {
    console.log('listen 5757');
})

// 大厅
let hall = null;
// 匹配队列
let queue = null;
// 最大房间数
let MAX = 30;
// 游戏房间
let rooms = [];

function Room() {
    this.people = 0;
    this.socket = null;
}

function Queue() {
    this.people = 0;
    this.socket = null;
}

function Hall() {
    this.people = 0;
    this.socket = null;
}

hall = new Hall();
queue = new Queue();

// 创造这么多个房间
for (let n = 0; n < MAX; n++) {
    rooms[n] = new Room();
}

function getFreeRoom(){
    for(let n = 0; n < MAX; n++){
        if(rooms[n].people === 0){
            return n;
        }
    }
    return -1;
}

io.people = 0;

let room = "room1";

io.on('connection', function (socket) {
    io.people++;
    console.log('someone connected 是谁 ' + socket.id + " #" + io.people);

    socket.on('disconnect', function () {
        io.people--;
        console.log('断开链接');
    })
})

queue.socket = io.of('/queue').on('connection', function(socket){
    queue.people++;
    console.log('some one connect queue socket. ' + queue.people);
    if(queue.people === 1){
        let roomId = getFreeRoom();
        console.log('拿到房间 ' + roomId);
        socket.emit('game mode', 'single');
        if (roomId >= 0) {
            queue.socket.emit('match success', roomId);
            console.log('match success. ' + queue.people + ' in queue');
        } else {
            console.log('no free room');
        }
    } else if(queue.people === 2){
        socket.emit('game mode', 'multi');
        let roomId = getFreeRoom();
        console.log('拿到房间 ' + roomId);
        if(roomId >= 0){
            queue.socket.emit('match success', roomId);
            console.log('match success. ' + queue.people + ' in queue');
        } else {
            console.log('no free room');
        }
    }

    socket.on('cancel match', function(){
        queue.people--;
        console.log('some cancel match ' + queue.people);
    })

    socket.on('disconnect', function(){
        queue.people--;
        console.log('some disconneced match ' + queue.people);
    })
})

hall.socket = io.of('/hall').on('connection', function (socket) {
    hall.people++;
    console.log('a player connected. ' + hall.people);
    hall.socket.emit('people changed', hall.people);

    socket.on('disconnect', function () {
        hall.people--;
        console.log('a player disconnected. left ' + hall.people + ' in hall');
        hall.socket.emit('people changed', hall.people);
    })
})

// 同时创建这么多个房间的链接的socket监听
for (let i = 0; i < MAX; i++) {
    rooms[i].socket = io.of('/rooms' + i).on('connection', function (socket) {
        rooms[i].people++;
        console.log('房间' + i + " 有 " + rooms[i].people+'个人');
        // 设置球员的顺序，如果当前有两个则设置位player1，如果有3个则将第三个设置位player2
        if(rooms[i].people == 2){
            socket.emit('set player', 'player1')
        } else if(rooms[i].people == 3){
            socket.emit('set player', 'player2')
        }
        // 射球开始
        socket.on('shootstart', function (info) {
            console.log(info);
            socket.broadcast.emit('shootstart', info);
        })

        // 射球结束，如果是多人，则切换当前射门的选手
        socket.on('shootend', function (info) {
            console.log(info);
            socket.broadcast.emit('shootend', info);
        })

        // 调整方向的，控制方向和射球
        socket.on('control', function(info){
            console.log(info);
            socket.broadcast.emit('control', info);
        })

        socket.on('disconnect', function () {
            rooms[i].people--;
            console.log('someone disconnected room ' + i);
        })

    })
}