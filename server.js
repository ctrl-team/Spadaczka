const express = require('express');
const socket = require('socket.io');
let lista = [];
const app = express();
let users = [] 
let port = 8080; //PORT
app.use(express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(port, function() {
  console.log('✨✨✨ Server ON! port: ' + port);
});

let io = socket(listener)

io.on('connection', function(socket) {
  console.log('Connected')
  
  socket.on("joined", (nick)=>{
    users[socket.id] = nick;
    lista.push(nick)    
    let data = {
      message: `<span style="color: white">${nick}</span>` + " dołączył do rozmowy",
      author: '<b style="color: #ff584d">Server</b>',
      time: '¥',
      footer: ''
    }
    io.sockets.emit('message' , data)
  })
  
  socket.on('disconnect', function() {
    
    
    if(typeof users[socket.id] == 'undefined') return; 
    
    lista.splice(lista.indexOf(users[socket.id]) , 1)
    
    let data = {
      message: `<span style="color: white">${users[socket.id]}</span>`+ " wyszedł",
      author: '<b style="color: #ff584d">Server</b>',
      time: "¥" ,
      footer: ''
    }
    io.sockets.emit('message', data)
    //to? Ta
    
  }) 
  
  socket.on("msg", (msgData)=>{
    let data = {
      message: msgData.message.replace(/<[^>]*>?/gm, ''),
      author: msgData.author,
      time: msgData.time,
      footer: ''

    }
    
    if(data.message.includes("/shrug")){
      data.message = data.message.replace(/\/shrug/g, "¯\\_(ツ)_/¯")
    }
    
    if(data.message.includes("/flip")){
      data.message = data.message.replace(/\/flip/g, "(╯°□°）╯︵ ┻━┻ ")
    }
    
    if(data.message.startsWith("/reload")){
      if(data.author == "Nimplex" || data.author == "jaca"){
        data.message = '<meta http-equiv="refresh" content="1;" />'
      }
    }
    
    if(data.message == "/users"){
      let nicked = data.author;
      data.author = '<b style="color: #ff584d">Server</b>';
      data.time = "¥";
      data.message = `Użytkownicy na serwerze:<br/> ${lista}`;
      data.footer = "Wywołane przez: " + nicked;
    }
    
    io.sockets.emit('message' , data)
  })
})
