let socket;

const message_input = document.getElementById('message_input');
const messages = document.getElementById('messages')
const btn = document.getElementById('btn');
$(document).ready(function() {
$("#message_input").emojioneArea({
  inline: true,
  shortcuts: true,
  events: {
    keyup: function (editor, event) {
      if (event.which == 13) {
        key()
      }
    }
  }
});
});
let message;
let nickname = prompt('Nickname: ');

nickname = nickname.replace(/<[^>]*>?/gm, '')

let len = nickname.replace(" ", "").replace(" ","").length;

function dup(){
    nickname = prompt('Nickname: ');
    nickname = nickname.replace(/<[^>]*>?/gm, '')
    len = nickname.replace(/ /g, "").length;
    if(len == 0){
        dup();
    }
    if(len > 20){
        dup();
    }
}

if(len > 20){
    dup();
}

if(len == 0){
    dup()
}

socket = io.connect('https://spadaczka.glitch.me/')
socket.emit("joined",nickname)

socket.on("message", (data)=>{
    /*if(data.message == "/clear"){
        
      if(data.author == 'jaca' || data.author == 'Nimplex'){
        return messages.innerHTML = "";
      }
      
    }*/ 
    if(data.message.startsWith("https://")) data.message = `<a href="${data.message}" target="_blank">${data.message}</a>`
    if(data.message.startsWith("http://")) data.message = `<a href="${data.message}" target="_blank">${data.message}</a>`
    let message_div = document.createElement('div');
 

    message_div.innerHTML = `<span class="smaller_msg">${data.author} - ${data.time}</span><br/>${data.message}<br/><span class="smaller_msg">${data.footer}</span>`
    message_div.className = 'message';

    messages.appendChild(message_div);
    window.scrollTo(0,document.body.scrollHeight);
    
})

function key(){
                var dt = new Date();
                //thx https://stackoverflow.com/questions/14529381/leading-zeros-in-minutes/14529626
                if (parseInt(dt.getMinutes()) < 10) {minutes = "0" + dt.getMinutes();} else minutes = dt.getMinutes();
                if (parseInt(dt.getSeconds()) < 10) {seconds = "0" + dt.getSeconds();} else seconds = dt.getSeconds();

                var tim2e = dt.getHours() + ":" + minutes

                let msgData = {
                  message: $("#message_input")[0].emojioneArea.getText(),
                  time: tim2e,
                  author: nickname
                }



                let len2 = msgData.message.replace(/ /g, "").length

                if(len2 !== 0)
                  {
                    socket.emit("msg", msgData);
                  }

                $("#message_input")[0].emojioneArea.setText('')
                }
             