const express =  require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);

const rooms = {};
const discClient = (clientID) => {
    console.log(clientID)
    for (var roomID in rooms) {
        const roomIndex = rooms[roomID].indexOf(clientID)
        console.log(roomIndex)
        if (roomIndex != -1){
            rooms[roomID].splice(roomIndex, 1)
            if (rooms[roomID].length === 0) {
                delete rooms[roomID]
        }
        }
    }
}


io.on('connection', socket => {
    /*
        If a peer is initiator, he will create a new room
        otherwise if peer is receiver he will join the room
    */
    socket.on('join room', roomID => {
        if(rooms[roomID]){

            if(rooms[roomID].length >= 2){
                console.log("Join error: room " + roomID+" is overflowing.");
                socket.emit("join error", 'В комнате уже присутствует два собеседника.')
            } else {
                // Receiving peer joins the room
            socket.emit("join successfull");
            rooms[roomID].push(socket.id);
            console.log("User "+socket.id+" joined in: " + roomID);
            const otherUser = rooms[roomID].find(id => id !== socket.id);
            console.log(otherUser)
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
            }   
        }
        else{
            // Initiating peer create a new room
            console.log("Join error: room " + roomID+" does not exists.");
            socket.emit("join error", 'Комнаты с таким ID не существует.')
        }

        /*
            If both initiating and receiving peer joins the room,
            we will get the other user details.
            For initiating peer it would be receiving peer and vice versa.
        */
    });

    socket.on('create room', roomID => {
        if(rooms[roomID]) {
            socket.emit('create error', 'Комната с таким ID уже существует.')
            console.log("Room ID "+roomID+" already exists");
        } else {
            rooms[roomID] = [socket.id];
            console.log("Room "+roomID+" has been created by: " + socket.id);
            console.log(rooms)
        }
    })


    socket.on('disconnect', () => {
        console.log('ОТВАЛИЛСЯ')
        discClient(socket.id)
        console.log(rooms)
    })

    /*
        The initiating peer offers a connection
    */
    socket.on('offer', payload => {
        io.to(payload.target).emit('offer', payload);
    });

    /*
        The receiving peer answers (accepts) the offer
    */
    socket.on('answer', payload => {
        io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', incoming => {
        io.to(incoming.target).emit('ice-candidate', incoming.candidate);
    })
});




server.listen(9000, () => console.log("Server is up and running on Port 9000"));