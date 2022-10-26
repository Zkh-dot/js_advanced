w = new WebSocket("ws://scv.forshielders.ru:4444/new_message")
xml = new XMLHttpRequest() 

w.onmessage = (msg) => {
    let container = document.createElement('div')
    container.append(`from ${document.getElementById('whoami?').textContent}: ${msg.data}`)
    document.getElementById("inpukt").before(container)
}
console.log('client side is running')

function send_new_msg(){

    xml.open("POST", document.location.toString() + "/send")
    xml.send(document.getElementById('newmsg').value)
    let container = document.createElement('div')
    container.append(`from ${document.getElementById('whoami?').textContent}: ${document.getElementById('newmsg').value}`)
    document.getElementById("inpukt").before(container)
    document.getElementById('newmsg').value = ''   
}

function rmfriend(){
    xml.open("POST", "/rmfriend")
    xml.send(document.location.toString().split('/')[4])
}

function blacklist(){
    xml.open("POST", "/rmfriend")
    xml.send(document.location.toString().split('/')[4])
}