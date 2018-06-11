'use strict'

let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
app.use(express.static(__dirname + '/public'));

server.listen(9999, function () {
    console.log('listen 9999');
})

let room = "room1";

io.on('connection', function (socket) {
    console.log('someone connected 是谁 ' + socket.id + " #" + socket.msg);
    io.emit('connected', 'You connected me');
    // 接收到微信的消息，然后发送play消息出去
    try {
        // 添加到相同得房间
        socket.join(room, function () {
            console.log(socket.id + ' 加入了 房间 ' + socket.rooms);
        })

        socket.on('disconnect', function (data) {
            console.log('断开链接');
            io.emit('off', '离开')
        })

        socket.on('football', function (msg) {
            console.log('打球 ' + msg);
            io.emit('football', '打球呀傻子' + msg);
        })

        socket.on('error', function (msg) {
            console.log('链接错误 ' + msg);
        })

        socket.on('disconnect', (reason) => {
            console.log('断开链接 ' + reason);
        })

        // 接收到手柄的消息
        socket.on('handplay', function (msg) {
            // io.emit('handplay', msg);
            var myroom = Object.keys(socket.rooms)[1];
            var obj = JSON.parse(msg);
            obj.room = myroom;
            msg = JSON.stringify(obj);
            console.log(msg);
            io.to(myroom).emit('handplay', msg);
        })

        // 接受到游戏界面的消息，选择游戏模式
        socket.on('gamemode', function (msg) {
            var mode = {};
            var myroom = Object.keys(socket.rooms)[1];
            mode.mode = msg;
            mode.room = myroom;
            var modeStr = JSON.stringify(mode);
            console.log(' 游戏模式 ' + modeStr);
            io.to(myroom).emit('selectmode', modeStr);
        });

        // 监听射球的状态，完成射击，开始踢球等
        socket.on('shootstatus', function (msg) {
            var myroom = Object.keys(socket.rooms)[1];
            console.log("射球状态 " + msg);
            io.to(myroom).emit('handstatus', msg);
        })

    } catch (err) {
        console.log(err)
    }
})