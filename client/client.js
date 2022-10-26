w = new WebSocket("wss://scv.forshielders.ru/new_message")


w.onmessage = (msg) => {
    let container = document.createElement('div')
    container.append(`from ${document.getElementById('whoami?').textContent}: ${msg.data}`)
    document.getElementById("inpukt").before(container)
}
console.log('client side is running')

function send_new_msg(){
    let xml = new XMLHttpRequest() 
    xml.open("POST", document.location.toString() + "/send")
    xml.send(document.getElementById('newmsg').value)
    let container = document.createElement('div')
    container.append(`from ${document.getElementById('whoami?').textContent}: ${document.getElementById('newmsg').value}`)
    document.getElementById("inpukt").before(container)
    document.getElementById('newmsg').value = ''   
}

function logout(){
    document.location = "/logout"
}

function rmfriend(){
    document.location = `/rmfriend?friend=${document.location.toString().split('/')[4]}`
}

function blacklist(){
    document.location = `/blacklist?friend=${document.location.toString().split('/')[4]}`
}